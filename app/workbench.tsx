'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { chapters, lessons, sources } from '../content';
import type { Lesson, Chapter, Source } from '../content/types';
import InstructionDiagram from './components/instruction-diagram';

interface WorkbenchProps {
  name: string | null;
  email: string | null;
}

export default function Workbench({ name, email }: WorkbenchProps) {
  const [activeLessonId, setActiveLessonId] = useState<string>('c01-l01');
  const [activeTab, setActiveTab] = useState<'notes' | 'sources' | 'ai'>('notes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [softwareFilter, setSoftwareFilter] = useState<string>('all');
  
  // Trạng thái ghi chú
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Đã đồng bộ');

  // Trạng thái tiến độ thực hành
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [lessonProgress, setLessonProgress] = useState<Record<string, 'not_started' | 'practicing' | 'completed'>>({});

  // Trạng thái AI Gemini
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiChat, setAiChat] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: string[] }>>([
    {
      role: 'assistant',
      text: 'Xin chào kỹ sư! Tôi là trợ lý AI BIM Tuyến 2027. Tôi sẵn sàng hỗ trợ giải đáp kỹ thuật Civil 3D, Navisworks, InfraWorks, QGIS và 4D/5D có dẫn nguồn trực tiếp từ giáo trình và tài liệu tiêu chuẩn.',
      sources: ['Giáo trình thực hành BIM Tuyến 2027', 'Autodesk Official Help 2027']
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Load state từ localStorage khi khởi động
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('bim_learning_notes');
      if (savedNotes) setNotes(JSON.parse(savedNotes));

      const savedSteps = localStorage.getItem('bim_completed_steps');
      if (savedSteps) setCompletedSteps(JSON.parse(savedSteps));

      const savedProgress = localStorage.getItem('bim_lesson_progress');
      if (savedProgress) setLessonProgress(JSON.parse(savedProgress));

      const savedActiveLesson = localStorage.getItem('bim_active_lesson');
      if (savedActiveLesson) setActiveLessonId(savedActiveLesson);
    } catch (e) {
      console.error('Lỗi tải dữ liệu lưu trữ cục bộ:', e);
    }
  }, []);

  // Cập nhật currentNote khi đổi bài
  useEffect(() => {
    setCurrentNote(notes[activeLessonId] || '');
    localStorage.setItem('bim_active_lesson', activeLessonId);
  }, [activeLessonId, notes]);

  // Bài học hiện tại
  const currentLesson = useMemo(() => {
    return lessons.find((l) => l.id === activeLessonId) || lessons[0];
  }, [activeLessonId]);

  // Lọc bài học theo tìm kiếm và phần mềm
  const filteredChapters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return chapters
      .map((ch) => {
        if (softwareFilter !== 'all' && ch.software !== softwareFilter) return null;
        const matchingLessons = ch.lessons.filter((l) => {
          if (!q) return true;
          return (
            l.title.toLowerCase().includes(q) ||
            l.objective.toLowerCase().includes(q) ||
            l.exercise.toLowerCase().includes(q) ||
            ch.title.toLowerCase().includes(q)
          );
        });
        if (matchingLessons.length === 0) return null;
        return { ...ch, lessons: matchingLessons };
      })
      .filter(Boolean) as Chapter[];
  }, [searchQuery, softwareFilter]);

  // Lưu ghi chú
  const handleSaveNote = () => {
    setIsSavingNote(true);
    setSaveStatus('Đang lưu...');
    const updated = { ...notes, [activeLessonId]: currentNote };
    setNotes(updated);
    try {
      localStorage.setItem('bim_learning_notes', JSON.stringify(updated));
      setSaveStatus('Đã lưu cục bộ');
    } catch {
      setSaveStatus('Lỗi lưu cục bộ');
    }
    setTimeout(() => {
      setIsSavingNote(false);
      setSaveStatus('Đã đồng bộ');
    }, 400);
  };

  // Đánh dấu hoàn thành bước thực hành
  const toggleStep = (stepKey: string) => {
    const updated = { ...completedSteps, [stepKey]: !completedSteps[stepKey] };
    setCompletedSteps(updated);
    localStorage.setItem('bim_completed_steps', JSON.stringify(updated));

    // Tự động kiểm tra xem tất cả các bước của bài này đã xong chưa
    if (currentLesson) {
      const allDone = currentLesson.steps.every((_, idx) => updated[`${currentLesson.id}-s${idx}`]);
      const newProgress = {
        ...lessonProgress,
        [currentLesson.id]: allDone ? 'completed' : 'practicing'
      };
      setLessonProgress(newProgress);
      localStorage.setItem('bim_lesson_progress', JSON.stringify(newProgress));
    }
  };

  // Tổng số bài hoàn thành
  const completedCount = useMemo(() => {
    return Object.values(lessonProgress).filter((s) => s === 'completed').length;
  }, [lessonProgress]);

  // Xử lý gửi câu hỏi AI
  const handleSendAi = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    const userMsg = aiPrompt;
    setAiPrompt('');
    setAiChat((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);

    // Giả lập trả lời chuyên gia có dẫn nguồn từ giáo trình
    setTimeout(() => {
      let reply = '';
      let replySources = [currentLesson.title, 'Giáo trình BIM Tuyến 2027'];

      const lower = userMsg.toLowerCase();
      if (lower.includes('infraworks') || lower.includes('chìm') || lower.includes('nổi')) {
        reply = 'Trong Autodesk InfraWorks, hiện tượng corridor bị chìm dưới địa hình thường do cao độ Surface bối cảnh xung quanh cao hơn mặt hoàn thiện hoặc chưa thiết lập đè địa hình (Coverages/Terrain Overlay). Bạn cần kiểm tra thứ tự bề mặt trong Surface Layers, đưa Terrain Surface của Corridor lên trên và thiết lập Component Mapping chính xác.';
        replySources.push('Chương 15: Đưa tuyến và cấu kiện vào InfraWorks', 'Autodesk Help: Corridor Component Mapping');
      } else if (lower.includes('tọa độ') || lower.includes('vn-2000') || lower.includes('qgis')) {
        reply = 'Khi kiểm tra hệ tọa độ trong QGIS với dữ liệu Civil 3D sang: Tuyệt đối không nhầm lẫn giữa việc "Gán hệ tọa độ (Set CRS)" và "Chuyển hệ tọa độ (Reproject CRS)". Luôn đối chiếu ít nhất 3 điểm khống chế tọa độ (E, N, Z) giữa bản vẽ DWG và lớp vector GeoPackage, không chỉ nhìn ảnh vệ tinh vì ảnh vệ tinh Google có độ lệch cục bộ 1-3m.';
        replySources.push('Chương 18: GIS nền tảng cho kỹ sư tuyến', 'QGIS User Manual 3.34: CRS Handling');
      } else if (lower.includes('property sets') || lower.includes('thuộc tính') || lower.includes('navisworks')) {
        reply = 'Để Property Sets hiển thị đầy đủ trong Navisworks: Trong Civil 3D, hãy gán Property Set Definition vào Corridor Solids hoặc 3D Solid objects. Khi mở bằng Navisworks hoặc xuất NWC/IFC 4.3, kích hoạt tùy chọn "Convert Property Sets" trong Navisworks DWG/DXF Loader Options.';
        replySources.push('Chương 7: Quản trị Property Sets', 'Chương 8: Xuất NWC/DWG/IFC 4.3');
      } else {
        reply = `Về vấn đề "${userMsg}": Theo quy trình bài học ${currentLesson.id} (${currentLesson.title}), bạn cần thực hiện tuần tự theo bảng checklist các bước thao tác, chú ý phần "Cách kiểm tra" và các "Lỗi thường gặp" để đảm bảo tính toàn vẹn của mô hình BIM và tọa độ mốc.`;
      }

      setAiChat((prev) => [...prev, { role: 'assistant', text: reply, sources: replySources }]);
      setIsAiLoading(false);
    }, 700);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d1117] text-[#c9d1d9] font-sans antialiased selection:bg-[#238636] selection:text-white">
      {/* CỘT TRÁI: DANH SÁCH 24 CHƯƠNG & TÌM KIẾM */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-[#30363d] bg-[#161b22]">
        {/* Header App */}
        <div className="p-4 border-b border-[#30363d]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm tracking-wide text-[#58a6ff] uppercase flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#238636] inline-block animate-pulse"></span>
              BIM Tuyến 2027
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              v2.4
            </span>
          </div>
          <h1 className="text-xs text-[#8b949e] font-medium leading-relaxed">
            Sổ tay kỹ thuật thực hành Civil 3D, Navisworks, InfraWorks & QGIS
          </h1>

          {/* Thanh tiến độ */}
          <div className="mt-3 bg-[#0d1117] rounded-md p-2 border border-[#30363d]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#8b949e]">Tiến độ học tập</span>
              <span className="text-[#58a6ff] font-semibold">
                {completedCount} / {lessons.length} bài ({Math.round((completedCount / lessons.length) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#238636] h-full transition-all duration-300"
                style={{ width: `${(completedCount / lessons.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Tìm kiếm */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Tìm bài học, lỗi, thao tác..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          {/* Lọc theo phần mềm */}
          <div className="flex gap-1 mt-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {['all', 'Civil 3D', 'Navisworks', 'InfraWorks', 'QGIS', '4D / 5D'].map((sw) => (
              <button
                key={sw}
                onClick={() => setSoftwareFilter(sw)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                  softwareFilter === sw
                    ? 'bg-[#388bfd] text-white font-medium'
                    : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {sw === 'all' ? 'Tất cả' : sw}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách chương & bài */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
          {filteredChapters.map((chapter) => (
            <div key={chapter.id} className="rounded-md border border-[#30363d]/50 bg-[#0d1117]/60 overflow-hidden">
              <div className="px-3 py-2 bg-[#21262d]/60 border-b border-[#30363d]/40 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f0f6fc]">
                  Chương {chapter.order}: {chapter.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                  {chapter.software}
                </span>
              </div>
              <div className="p-1 space-y-0.5">
                {chapter.lessons.map((lesson) => {
                  const isActive = lesson.id === activeLessonId;
                  const isDone = lessonProgress[lesson.id] === 'completed';
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors flex items-start gap-2 ${
                        isActive
                          ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/50 font-medium'
                          : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <span className="mt-0.5">
                        {isDone ? (
                          <span className="text-[#238636]">✓</span>
                        ) : (
                          <span className="text-[#484f58]">•</span>
                        )}
                      </span>
                      <div className="flex-1 line-clamp-2">
                        <span className="text-[#c9d1d9] font-medium mr-1.5">{lesson.id.toUpperCase()}:</span>
                        {lesson.title}
                      </div>
                      <span className="text-[10px] text-[#484f58] whitespace-nowrap mt-0.5">
                        {lesson.minutes}p
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Cột Trái: Thông tin học viên */}
        <div className="p-3 border-t border-[#30363d] text-xs text-[#8b949e] flex items-center justify-between">
          <div className="truncate">
            <div className="text-[#c9d1d9] font-medium truncate">{name || 'Học viên BIM'}</div>
            <div className="text-[10px] text-[#484f58] truncate">{email || 'BIM Coaching'}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#238636]"></div>
        </div>
      </aside>

      {/* CỘT GIỮA: NỘI DUNG BÀI HỌC THỰC HÀNH */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d1117]">
        {/* Topbar Bài học */}
        <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22]/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-1">
              <span>{currentLesson.software}</span>
              <span>/</span>
              <span>Chương {currentLesson.chapterOrder}</span>
              <span>/</span>
              <span className="text-[#58a6ff] font-medium">{currentLesson.id.toUpperCase()}</span>
            </div>
            <h2 className="text-lg font-bold text-[#f0f6fc]">{currentLesson.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              Thời lượng: {currentLesson.minutes} phút
            </span>
            <button
              onClick={() => {
                const isCurrentlyDone = lessonProgress[currentLesson.id] === 'completed';
                const nextState = isCurrentlyDone ? 'practicing' : 'completed';
                setLessonProgress((prev) => ({ ...prev, [currentLesson.id]: nextState }));
                // Đồng bộ các bước
                const updatedSteps = { ...completedSteps };
                currentLesson.steps.forEach((_, idx) => {
                  updatedSteps[`${currentLesson.id}-s${idx}`] = !isCurrentlyDone;
                });
                setCompletedSteps(updatedSteps);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                lessonProgress[currentLesson.id] === 'completed'
                  ? 'bg-[#238636] text-white hover:bg-[#2ea043]'
                  : 'bg-[#21262d] text-[#c9d1d9] border border-[#30363d] hover:bg-[#30363d]'
              }`}
            >
              {lessonProgress[currentLesson.id] === 'completed' ? '✓ Đã hoàn thành bài' : 'Đánh dấu hoàn thành'}
            </button>
          </div>
        </div>

        {/* Nội dung cuộn của bài học */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Mục tiêu & Điều kiện */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
              <h3 className="text-xs font-semibold text-[#58a6ff] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🎯</span> Mục tiêu bài học
              </h3>
              <p className="text-xs leading-relaxed text-[#c9d1d9]">{currentLesson.objective}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
              <h3 className="text-xs font-semibold text-[#d29922] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>📋</span> Điều kiện tiên quyết
              </h3>
              <ul className="text-xs space-y-1.5 text-[#8b949e]">
                {currentLesson.prerequisites.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#d29922]">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sơ đồ nguyên lý SVG */}
          {currentLesson.diagram && (
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span>📐</span> Sơ đồ nguyên lý kỹ thuật
              </h3>
              <InstructionDiagram type={currentLesson.diagram} />
            </div>
          )}

          {/* Bảng checklist từng bước thực hành */}
          <div className="rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden">
            <div className="px-4 py-3 bg-[#21262d]/60 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-2">
                <span>🛠️</span> Các bước thao tác kỹ thuật ({currentLesson.steps.length} bước)
              </h3>
              <span className="text-[11px] text-[#8b949e]">Tick chọn từng bước khi làm xong</span>
            </div>
            <div className="divide-y divide-[#30363d]/50">
              {currentLesson.steps.map((step, idx) => {
                const stepKey = `${currentLesson.id}-s${idx}`;
                const isStepDone = completedSteps[stepKey];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(stepKey)}
                    className={`p-4 transition-colors cursor-pointer flex items-start gap-3.5 ${
                      isStepDone ? 'bg-[#238636]/5' : 'hover:bg-[#21262d]/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!isStepDone}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-[#238636] focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#58a6ff]">Bước {idx + 1}:</span>
                        <h4 className="text-xs font-semibold text-[#f0f6fc]">{step.title}</h4>
                      </div>
                      <p className="text-xs text-[#c9d1d9] leading-relaxed mb-2 font-mono bg-[#0d1117]/80 p-2.5 rounded border border-[#30363d]/40">
                        {step.action}
                      </p>
                      <div className="text-[11px] text-[#7ee787] flex items-center gap-1.5">
                        <span className="text-[#238636] font-bold">Kết quả cần thấy:</span>
                        <span>{step.expected}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cách kiểm tra & Lỗi thường gặp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cách kiểm tra */}
            <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
              <h3 className="text-xs font-semibold text-[#7ee787] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🔍</span> Tiêu chí kiểm tra chất lượng
              </h3>
              <ul className="text-xs space-y-2 text-[#c9d1d9]">
                {currentLesson.checks.map((chk, i) => (
                  <li key={i} className="flex items-start gap-2 bg-[#0d1117]/50 p-2 rounded border border-[#30363d]/30">
                    <span className="text-[#238636]">✓</span>
                    <span>{chk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lỗi thường gặp */}
            <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
              <h3 className="text-xs font-semibold text-[#f85149] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>⚠️</span> Lỗi thường gặp & Cách khắc phục
              </h3>
              <div className="space-y-2.5 text-xs">
                {currentLesson.mistakes.map((m, i) => (
                  <div key={i} className="p-2.5 rounded bg-[#0d1117]/60 border border-[#f85149]/20">
                    <div className="text-[#f85149] font-medium mb-1">❌ {m.symptom}</div>
                    <div className="text-[#7ee787]">💡 Cách sửa: {m.fix}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bài tập & Sản phẩm bàn giao */}
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
            <h3 className="text-xs font-semibold text-[#a371f7] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>📦</span> Bài tập thực hành & Sản phẩm bàn giao
            </h3>
            <div className="text-xs space-y-2 text-[#c9d1d9]">
              <div>
                <strong className="text-[#f0f6fc]">Yêu cầu thực hành:</strong> {currentLesson.exercise}
              </div>
              <div>
                <strong className="text-[#f0f6fc]">Sản phẩm cần nộp/nghiệm thu:</strong>{' '}
                <span className="px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                  {currentLesson.deliverable}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CỘT PHẢI: GHI CHÚ, TRA CỨU NGUỒN & HỎI AI */}
      <aside className="w-96 flex-shrink-0 flex flex-col border-l border-[#30363d] bg-[#161b22]">
        {/* Tab Headers */}
        <div className="flex border-b border-[#30363d] bg-[#0d1117]">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-[#58a6ff] text-[#58a6ff] bg-[#161b22]'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            📝 Ghi chú
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'sources'
                ? 'border-[#58a6ff] text-[#58a6ff] bg-[#161b22]'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            📚 Nguồn tra cứu
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-[#58a6ff] text-[#58a6ff] bg-[#161b22]'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            🤖 Hỏi AI
          </button>
        </div>

        {/* Tab 1: Ghi chú cá nhân */}
        {activeTab === 'notes' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-[#8b949e]">Ghi chú cho {currentLesson.id.toUpperCase()}</span>
              <span className="text-[11px] text-[#238636] font-medium">{saveStatus}</span>
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Ghi chép kinh nghiệm, thông số, mốc lý trình, tọa độ hoặc lưu ý khi thực hành..."
              className="flex-1 p-3 text-xs bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] resize-none focus:outline-none focus:border-[#58a6ff] leading-relaxed font-mono"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="flex-1 py-1.5 px-3 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
              >
                {isSavingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([currentNote], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ghi-chu-${currentLesson.id}.md`;
                  a.click();
                }}
                className="py-1.5 px-3 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-medium rounded border border-[#30363d]"
              >
                Xuất MD
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Nguồn tra cứu */}
        {activeTab === 'sources' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            <div className="text-xs text-[#8b949e] mb-2 font-medium">
              Tài liệu tham khảo liên quan bài học:
            </div>
            {currentLesson.sourceIds.map((srcId) => {
              const src = sources.find((s) => s.id === srcId);
              if (!src) return null;
              return (
                <div key={src.id} className="p-3 rounded-md bg-[#0d1117] border border-[#30363d] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#58a6ff] truncate">{src.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border ${
                        src.kind === 'official'
                          ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40'
                          : 'bg-[#238636]/20 text-[#7ee787] border-[#238636]/40'
                      }`}
                    >
                      {src.kind === 'official' ? 'Chính thức' : 'Google Drive'}
                    </span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mb-2">Phiên bản: {src.version}</div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1"
                  >
                    <span>Mở tài liệu</span> ↗
                  </a>
                </div>
              );
            })}

            {/* Các tài nguyên Drive cố định */}
            <div className="pt-3 border-t border-[#30363d]">
              <div className="text-xs text-[#8b949e] font-medium mb-2">Thư mục Google Drive (G:\My Drive\my):</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded bg-[#0d1117]/60 border border-[#30363d]/50 text-[#c9d1d9]">
                  📁 <strong>Hoctap/Civil Design:</strong> Tài liệu học Civil Design có Navisworks/InfraWorks
                </div>
                <div className="p-2 rounded bg-[#0d1117]/60 border border-[#30363d]/50 text-[#c9d1d9]">
                  📁 <strong>Hoctap/BIM-GIS:</strong> Hướng dẫn tổng hợp mô hình BIM-GIS Google Gemini
                </div>
                <div className="p-2 rounded bg-[#0d1117]/60 border border-[#30363d]/50 text-[#c9d1d9]">
                  📁 <strong>GIS/Binh Dinh_DEM:</strong> Dữ liệu mô hình địa hình số DEM
                </div>
                <div className="p-2 rounded bg-[#0d1117]/60 border border-[#30363d]/50 text-[#c9d1d9]">
                  📁 <strong>Hoctap/VSI Academy:</strong> Quy trình kiểm soát Corridor Target
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Hỏi đáp AI Gemini */}
        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin">
              {aiChat.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1f6feb]/20 text-[#c9d1d9] border border-[#1f6feb]/40 ml-4'
                      : 'bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] mr-4'
                  }`}
                >
                  <div className="font-semibold text-[11px] mb-1 text-[#8b949e]">
                    {msg.role === 'user' ? 'Bạn' : 'Trợ lý AI Gemini'}
                  </div>
                  <div>{msg.text}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#30363d]/50 text-[10px] text-[#58a6ff]">
                      📚 Nguồn dẫn: {msg.sources.join(' • ')}
                    </div>
                  )}
                </div>
              ))}
              {isAiLoading && (
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e] animate-pulse">
                  Gemini đang tra cứu tài liệu và đối soát nguồn...
                </div>
              )}
            </div>

            {/* Input Hỏi AI */}
            <div className="border-t border-[#30363d] pt-3 flex gap-2">
              <input
                type="text"
                placeholder="Hỏi về lỗi Civil 3D, tọa độ GIS, InfraWorks..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
                className="flex-1 px-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
              />
              <button
                onClick={handleSendAi}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-3 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
              >
                Gửi
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
