import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminTestService } from '../services/adminTestService';
import type {
  GroupAnswer,
  GroupQuestion,
  MediaAsset,
  QuestionGroupDetail,
  QuestionGroupSummary,
  ReviewStatus,
  GenerateGroupAiSupportInput,
} from '../types/adminTestTypes';
import { persistDirtyReviewGroupDetail } from '../components/review-groups/reviewGroupPersistence';
import {
  BLOCKING_REVIEW_FLAGS,
  cloneDirtyState,
  createDirtyState,
  getErrorMessage,
  getPassageTitleFromLabel,
  hasDirtyState,
  type AiGenerateAction,
  type DirtyPatch,
  type DirtyState,
  type SaveStatus,
} from '../components/review-groups/reviewGroupUtils';

interface UseReviewGroupsControllerParams {
  testId: number;
  nextStep: () => void;
  prevStep: () => void;
}

const getAiErrorMessage = (message: string) => {
  if (message.includes('AI_MISSING_REQUIRED_CONTEXT') || message.includes('AI generation is missing required context')) {
    return 'Thiếu dữ liệu để tạo giải thích. Part 1 cần transcript, image, answer text và đáp án đúng; Part 2 cần transcript, answer text và đáp án đúng; Part 3/4 cần transcript và đáp án đúng, thêm image nếu có graphic; Part 5 cần question text, answers và đáp án đúng; Part 6/7 cần passage text hoặc passage image, answers và đáp án đúng.';
  }
  return message;
};

export const useReviewGroupsController = ({
  testId,
  nextStep,
  prevStep,
}: UseReviewGroupsControllerParams) => {
  const [groups, setGroups] = useState<QuestionGroupSummary[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [detail, setDetail] = useState<QuestionGroupDetail | null>(null);
  const [activePart, setActivePart] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [generatingAiAction, setGeneratingAiAction] = useState<AiGenerateAction | null>(null);
  const [dirtyVersion, setDirtyVersion] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const detailRef = useRef<QuestionGroupDetail | null>(null);
  const lastSavedDetailRef = useRef<QuestionGroupDetail | null>(null);
  const dirtyRef = useRef<DirtyState>(createDirtyState());
  const dirtyVersionRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const activePartRef = useRef(activePart);
  const selectedGroupIdRef = useRef(selectedGroupId);

  useEffect(() => {
    detailRef.current = detail;
  }, [detail]);

  useEffect(() => {
    activePartRef.current = activePart;
  }, [activePart]);

  useEffect(() => {
    selectedGroupIdRef.current = selectedGroupId;
  }, [selectedGroupId]);

  const imageAssets = useMemo(() => mediaAssets.filter((asset) => asset.media_type === 'image'), [mediaAssets]);
  const audioAssets = useMemo(() => mediaAssets.filter((asset) => asset.media_type === 'audio'), [mediaAssets]);
  const availableParts = useMemo(() => {
    const parts = Array.from(new Set(groups.map((group) => group.part_number))).sort((a, b) => a - b);
    return parts.length ? parts : [1, 2, 3, 4, 5, 6, 7];
  }, [groups]);
  const activePartGroups = useMemo(
    () => groups.filter((group) => group.part_number === activePart),
    [groups, activePart]
  );
  const filteredGroups = activePartGroups;
  const reviewableGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          group.review_status !== 'reviewed' &&
          !group.missing_flags.some((flag) => BLOCKING_REVIEW_FLAGS.includes(flag))
      ),
    [groups]
  );
  const blockedReviewCount = useMemo(
    () =>
      groups.filter(
        (group) =>
          group.review_status !== 'reviewed' &&
          group.missing_flags.some((flag) => BLOCKING_REVIEW_FLAGS.includes(flag))
      ).length,
    [groups]
  );

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const loadGroupDetail = useCallback(async (groupId: number) => {
    try {
      setLoadingDetail(true);
      setErrorMsg('');
      const res = await adminTestService.getQuestionGroupDetail(groupId);
      if (res.code === 1000) {
        setDetail(res.result);
        detailRef.current = res.result;
        lastSavedDetailRef.current = res.result;
        dirtyRef.current = createDirtyState();
        dirtyVersionRef.current = 0;
        setDirtyVersion(0);
        setSaveStatus('idle');
      } else {
        setErrorMsg(res.message || 'Không thể tải chi tiết nhóm câu.');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể tải chi tiết nhóm câu.'));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const loadGroups = useCallback(
    async (preferredGroupId?: number) => {
      try {
        setLoadingList(true);
        setErrorMsg('');
        const [groupsRes, mediaRes] = await Promise.all([
          adminTestService.getQuestionGroups(testId),
          adminTestService.getTestMedia(testId),
        ]);

        if (groupsRes.code === 1000) {
          const nextGroups = groupsRes.result || [];
          setGroups(nextGroups);
          const activePartGroups = nextGroups.filter((group) => group.part_number === activePartRef.current);
          const nextSelectedId = preferredGroupId || selectedGroupIdRef.current || activePartGroups[0]?.id || nextGroups[0]?.id || null;
          setSelectedGroupId(nextSelectedId);
          selectedGroupIdRef.current = nextSelectedId;
          if (nextSelectedId) {
            await loadGroupDetail(nextSelectedId);
          } else {
            setDetail(null);
          }
        } else {
          setErrorMsg(groupsRes.message || 'Không thể tải danh sách nhóm câu.');
        }

        if (mediaRes.code === 1000) {
          setMediaAssets(mediaRes.result || []);
        }
      } catch (err) {
        setErrorMsg(getErrorMessage(err, 'Không thể tải dữ liệu review.'));
      } finally {
        setLoadingList(false);
      }
    },
    [loadGroupDetail, testId]
  );

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const autoLinkMedia = useCallback(async () => {
    try {
      setAutoLinking(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await adminTestService.autoLinkMedia(testId);
      if (res.code === 1000) {
        const { linked_audios, linked_images, linked_passages } = res.result;
        const total = linked_audios + linked_images + linked_passages;
        if (total > 0) {
          setSuccessMsg(
            `Đã tự động liên kết thành công ${linked_audios} audio, ${linked_images} hình ảnh biểu đồ, ${linked_passages} bài đọc vào các câu hỏi!`
          );
        } else {
          setSuccessMsg('Tất cả media phù hợp đã được liên kết trước đó hoặc không tìm thấy file phù hợp.');
        }
        await loadGroups(selectedGroupIdRef.current || undefined);
      } else {
        setErrorMsg(res.message || 'Tự động liên kết media thất bại.');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Tự động liên kết media thất bại.'));
    } finally {
      setAutoLinking(false);
    }
  }, [loadGroups, testId]);

  const resetDirtyState = () => {
    dirtyRef.current = createDirtyState();
    dirtyVersionRef.current = 0;
    setDirtyVersion(0);
    setSaveStatus('idle');
  };

  const updateCurrentGroup = (nextDetail: QuestionGroupDetail) => {
    setDetail(nextDetail);
    detailRef.current = nextDetail;
    lastSavedDetailRef.current = nextDetail;
    setGroups((prev) =>
      prev.map((group) =>
        group.id === nextDetail.id
          ? {
              ...group,
              review_status: nextDetail.review_status,
              missing_flags: nextDetail.missing_flags ?? group.missing_flags,
            }
          : group
      )
    );
  };

  const updateGroupSummary = (nextDetail: QuestionGroupDetail) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === nextDetail.id
          ? {
              ...group,
              review_status: nextDetail.review_status,
              missing_flags: nextDetail.missing_flags ?? group.missing_flags,
            }
          : group
      )
    );
  };

  const refreshGroupSummaries = async (currentGroupId?: number) => {
    const res = await adminTestService.getQuestionGroups(testId);
    if (res.code !== 1000) return;

    const nextGroups = res.result || [];
    setGroups(nextGroups);

    if (!currentGroupId) return;
    const currentSummary = nextGroups.find((group) => group.id === currentGroupId);
    if (!currentSummary || detailRef.current?.id !== currentGroupId) return;

    const nextDetail = {
      ...detailRef.current,
      review_status: currentSummary.review_status,
      missing_flags: currentSummary.missing_flags,
    };
    setDetail(nextDetail);
    detailRef.current = nextDetail;
  };

  const markDirty = (patch: DirtyPatch) => {
    if (patch.images) dirtyRef.current.images = true;
    if (patch.audio) dirtyRef.current.audio = true;
    if (patch.passages) dirtyRef.current.passages = true;
    patch.questionIds?.forEach((id) => dirtyRef.current.questionIds.add(id));
    patch.answerIds?.forEach((id) => dirtyRef.current.answerIds.add(id));
    dirtyVersionRef.current += 1;
    setDirtyVersion(dirtyVersionRef.current);
    setSaveStatus('dirty');
  };

  const saveDirtyDetail = useCallback(async () => {
    if (savePromiseRef.current) return savePromiseRef.current;

    const snapshot = detailRef.current;
    const dirtySnapshot = cloneDirtyState(dirtyRef.current);
    const startVersion = dirtyVersionRef.current;
    if (!snapshot || !hasDirtyState(dirtySnapshot)) return true;

    clearSaveTimer();
    const savePromise = (async () => {
      try {
        setSaving(true);
        setSaveStatus('saving');
        setErrorMsg('');
        const latestDetail = await persistDirtyReviewGroupDetail(snapshot, dirtySnapshot);

        updateGroupSummary(latestDetail);
        await refreshGroupSummaries(snapshot.id);
        lastSavedDetailRef.current = snapshot;

        if (dirtyVersionRef.current === startVersion) {
          dirtyRef.current = createDirtyState();
          dirtyVersionRef.current = 0;
          setDirtyVersion(0);
          setSaveStatus('saved');
          if (detailRef.current?.id === latestDetail.id) {
            const current = detailRef.current;
            const nextDetail = {
              ...current,
              review_status: latestDetail.review_status,
              missing_flags: latestDetail.missing_flags,
            };
            setDetail(nextDetail);
            detailRef.current = nextDetail;
            lastSavedDetailRef.current = nextDetail;
          }
        } else {
          setSaveStatus('dirty');
        }

        return true;
      } catch (err) {
        setSaveStatus('error');
        setErrorMsg(getErrorMessage(err, 'Không thể tự lưu thay đổi. Vui lòng thử lại.'));
        return false;
      } finally {
        setSaving(false);
        savePromiseRef.current = null;
      }
    })();

    savePromiseRef.current = savePromise;
    return savePromise;
  }, [clearSaveTimer]);

  useEffect(() => {
    if (!dirtyVersion || !hasDirtyState(dirtyRef.current)) return;
    clearSaveTimer();
    saveTimerRef.current = window.setTimeout(() => {
      void saveDirtyDetail();
    }, 800);

    return clearSaveTimer;
  }, [clearSaveTimer, dirtyVersion, saveDirtyDetail]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasDirtyState(dirtyRef.current)) {
        void saveDirtyDetail();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearSaveTimer();
    };
  }, [clearSaveTimer, saveDirtyDetail]);

  const patchReviewStatus = async (reviewStatus: ReviewStatus) => {
    if (!detail) return;
    try {
      setSaving(true);
      setErrorMsg('');
      const saved = await saveDirtyDetail();
      if (!saved) return;
      const res = await adminTestService.patchReviewStatus(detail.id, reviewStatus);
      if (res.code === 1000) {
        updateCurrentGroup(res.result);
        await loadGroups(detail.id);
      } else {
        setErrorMsg(res.message || 'Không thể cập nhật trạng thái review.');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể cập nhật trạng thái review.'));
    } finally {
      setSaving(false);
    }
  };

  const markAllReviewed = async () => {
    if (!reviewableGroups.length) return;
    try {
      setSaving(true);
      setErrorMsg('');
      const saved = await saveDirtyDetail();
      if (!saved) return;

      for (const group of reviewableGroups) {
        const res = await adminTestService.patchReviewStatus(group.id, 'reviewed');
        if (res.code !== 1000) throw new Error(res.message || `Không thể đánh dấu group ${group.id} là đã review.`);
      }

      await loadGroups(selectedGroupId || reviewableGroups[0].id);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể đánh dấu tất cả nhóm là đã review.'));
    } finally {
      setSaving(false);
    }
  };

  const applyGeneratedDetail = (nextDetail: QuestionGroupDetail) => {
    updateCurrentGroup(nextDetail);
    resetDirtyState();
  };

  const generateAiDetail = async (
    action: AiGenerateAction,
    request: (groupId: number) => ReturnType<typeof adminTestService.generateGroupTranscript>,
    fallbackMessage: string
  ) => {
    const currentDetail = detailRef.current;
    if (!currentDetail) return;

    const saved = await saveDirtyDetail();
    if (!saved) return;

    const latestDetail = detailRef.current;
    if (!latestDetail) return;

    try {
      setGeneratingAiAction(action);
      setErrorMsg('');
      const res = await request(latestDetail.id);
      if (res.code === 1000) {
        applyGeneratedDetail(res.result);
      } else {
        const message = res.message || fallbackMessage;
        setErrorMsg(getAiErrorMessage(message));
      }
    } catch (err) {
      const message = getErrorMessage(err, fallbackMessage);
      setErrorMsg(getAiErrorMessage(message));
    } finally {
      setGeneratingAiAction(null);
    }
  };

  const generateGroupSupport = async (input: GenerateGroupAiSupportInput) => {
    const currentDetail = detailRef.current;
    if (!currentDetail) return;

    const saved = await saveDirtyDetail();
    if (!saved) return;

    const latestDetail = detailRef.current;
    if (!latestDetail) return;

    try {
      setGeneratingAiAction('group');
      setErrorMsg('');
      const res = await adminTestService.generateGroupAiSupport(latestDetail.id, input);
      if (res.code === 1000) {
        applyGeneratedDetail(res.result);
      } else {
        setErrorMsg(getAiErrorMessage(res.message || 'Không thể tạo nội dung cho group.'));
      }
    } catch (err) {
      setErrorMsg(getAiErrorMessage(getErrorMessage(err, 'Không thể tạo nội dung cho group.')));
    } finally {
      setGeneratingAiAction(null);
    }
  };

  const generateTranscript = () =>
    generateAiDetail(
      'transcript',
      adminTestService.generateGroupTranscript,
      'Không thể tạo transcript.'
    );

  const generateTranslation = () =>
    generateAiDetail(
      'translation',
      adminTestService.generateQuestionTranslation,
      'Không thể tạo bản dịch.'
    );

  const generateExplanations = () =>
    generateAiDetail(
      'explanations',
      adminTestService.generateQuestionExplanations,
      'Không thể tạo giải thích.'
    );

  const goPrevStep = async () => {
    const saved = await saveDirtyDetail();
    if (saved) prevStep();
  };

  const goNextStep = async () => {
    const saved = await saveDirtyDetail();
    if (saved) nextStep();
  };

  const selectGroup = async (groupId: number) => {
    const saved = await saveDirtyDetail();
    if (!saved) return;
    setSelectedGroupId(groupId);
    selectedGroupIdRef.current = groupId;
    await loadGroupDetail(groupId);
  };

  const selectPart = async (partNumber: number) => {
    const saved = await saveDirtyDetail();
    if (!saved) return;
    setActivePart(partNumber);
    activePartRef.current = partNumber;
    const firstGroup = groups.find((group) => group.part_number === partNumber);
    if (firstGroup) {
      setSelectedGroupId(firstGroup.id);
      selectedGroupIdRef.current = firstGroup.id;
      await loadGroupDetail(firstGroup.id);
    } else {
      setSelectedGroupId(null);
      selectedGroupIdRef.current = null;
      setDetail(null);
      detailRef.current = null;
      lastSavedDetailRef.current = null;
    }
  };

  const setDetailValue = (updater: (current: QuestionGroupDetail) => QuestionGroupDetail, dirtyPatch: DirtyPatch) => {
    setDetail((current) => {
      if (!current) return current;
      const nextDetail = updater(current);
      detailRef.current = nextDetail;
      return nextDetail;
    });
    markDirty(dirtyPatch);
  };

  const setQuestionValue = (questionId: number, field: keyof GroupQuestion, value: string | null) => {
    setDetailValue((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? { ...question, [field]: value } : question
      ),
    }), { questionIds: [questionId] });
  };

  const setAnswerValue = (answerId: number, field: keyof GroupAnswer, value: string | boolean | null) => {
    setDetailValue((current) => ({
      ...current,
      questions: current.questions.map((question) => ({
        ...question,
        answers: question.answers.map((answer) =>
          answer.id === answerId ? { ...answer, [field]: value } : answer
        ),
      })),
    }), { answerIds: [answerId] });
  };

  const setCorrectAnswer = (questionId: number, answerId: number) => {
    setDetailValue((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              answers: question.answers.map((answer) => ({
                ...answer,
                is_correct: answer.id === answerId,
              })),
            }
          : question
      ),
    }), {
      answerIds: detailRef.current?.questions.find((question) => question.id === questionId)?.answers.map((answer) => answer.id) || [],
    });
  };

  const addImage = () => {
    const firstImage = imageAssets[0];
    if (!firstImage) return;
    setDetailValue((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          media_asset_id: firstImage.id,
          label: firstImage.label,
          url: firstImage.url,
          order_index: current.images.length,
        },
      ],
    }), { images: true });
  };

  const addImagePassage = () => {
    const firstImage = imageAssets[0];
    if (!firstImage) return;
    setDetailValue((current) => ({
      ...current,
      passages: [
        ...current.passages,
        {
          media_asset_id: firstImage.id,
          label: firstImage.label,
          url: firstImage.url,
          title: getPassageTitleFromLabel(firstImage.label),
          passage_type: 'image',
          content_format: 'image',
          content_en: null,
          content_vi: null,
          vocab_hints: null,
          order_index: current.passages.length,
        },
      ],
    }), { passages: true });
  };

  const hasBlockingFlags = Boolean(
    detail?.missing_flags?.some((flag) => BLOCKING_REVIEW_FLAGS.includes(flag))
  );
  const saveStatusText =
    saveStatus === 'saving'
      ? 'Đang lưu thay đổi...'
      : saveStatus === 'dirty'
        ? 'Có thay đổi chưa lưu'
        : saveStatus === 'error'
          ? 'Lưu thất bại'
          : saveStatus === 'saved'
            ? 'Đã lưu'
            : 'Không có thay đổi';
  const saveStatusClass =
    saveStatus === 'error'
      ? 'text-[#b42318]'
      : saveStatus === 'dirty'
        ? 'text-[#b25e00]'
        : saveStatus === 'saving'
          ? 'text-[#004ac6]'
          : 'text-[#027a48]';
  return {
    activePart,
    addImage,
    addImagePassage,
    audioAssets,
    autoLinkMedia,
    autoLinking,
    availableParts,
    blockedReviewCount,
    detail,
    errorMsg,
    filteredGroups,
    generateExplanations,
    generateGroupSupport,
    generateTranscript,
    generateTranslation,
    generatingAiAction,
    goNextStep,
    goPrevStep,
    hasBlockingFlags,
    imageAssets,
    loadingDetail,
    loadingList,
    markAllReviewed,
    patchReviewStatus,
    reviewableGroups,
    saveStatusClass,
    saveStatusText,
    saving,
    selectGroup,
    selectPart,
    selectedGroupId,
    setAnswerValue,
    setCorrectAnswer,
    setDetailValue,
    setQuestionValue,
    setSuccessMsg,
    successMsg,
  };
};
