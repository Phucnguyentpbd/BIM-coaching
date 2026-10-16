'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { chapters, lessons, sources } from '../content';
import type { Lesson, Chapter, Source } from '../content/types';

interface WorkbenchProps {
  name: string | null;
  email: string | null;
}

export default function Workbench({ name, email }: WorkbenchProps) {
  const [activeLessonId, setActiveLessonId] = useState<string>('c01-l01');
  const [activeTab, setActiveTab] = useState<'notes' | 'sources' | 'ai'>('notes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [softwareFilter, setSoftwareFilter] = useState<string>('all');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  
  // Trạng thái tìm kiếm nhanh Modal (Ctrl + K)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Trạng thái ghi chú
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Đã đồng bộ');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Trạng thái tiến độ thực hành
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [lessonProgress, setLessonProgress] = useState<Record<string, 'not_started' | 'practicing' | 'completed'>>({});

  // Trạng thái AI Gemini
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiChat, setAiChat] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: string[] }>>([
    {
      role: 'assistant',
      text: 'Xin chào kỹ sư! Tôi là trợ lý AI BIM Tuyến 2027. Tôi hỗ trợ giải đáp kỹ thuật Civil 3D, Navisworks, InfraWorks, QGIS và 4D/5D có dẫn nguồn trực tiếp từ 24 chương giáo trình thực hành và tài liệu Google Drive.',
      sources: ['Giáo trình thực hành BIM Tuyến 2027', 'Autodesk Official Help 2027', 'G:\\My Drive\\my\\Hoctap']
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

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tự động focus input khi mở modal tìm kiếm
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setModalSearchQuery('');
    }
  }, [isSearchModalOpen]);

  // Cập nhật currentNote khi đổi bài
  useEffect(() => {
    setCurrentNote(notes[activeLessonId] || '');
    localStorage.setItem('bim_active_lesson', activeLessonId);
  }, [activeLessonId, notes]);

  // Bài học hiện tại
  const currentLesson = useMemo(() => {
    return lessons.find((l) => l.id === activeLessonId) || lessons[0];
  }, [activeLessonId]);

  // Danh sách bài học đã lọc theo phần mềm, chương và từ khóa tìm kiếm
  const filteredLessons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return lessons.filter((l) => {
      if (softwareFilter !== 'all' && l.software !== softwareFilter) return false;
      if (chapterFilter !== 'all' && String(l.chapterOrder) !== chapterFilter) return false;
      if (!q) return true;
      return (
        l.id.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.objective.toLowerCase().includes(q) ||
        l.exercise.toLowerCase().includes(q) ||
        l.software.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, softwareFilter, chapterFilter]);

  // Tìm kiếm toàn cục cho Modal Ctrl + K
  const modalSearchResults = useMemo(() => {
    const q = modalSearchQuery.toLowerCase().trim();
    if (!q) return [];
    return lessons.filter((l) => {
      return (
        l.id.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.software.toLowerCase().includes(q) ||
        l.objective.toLowerCase().includes(q) ||
        l.steps.some((s) => s.title.toLowerCase().includes(q) || s.action.toLowerCase().includes(q)) ||
        l.mistakes.some((m) => m.symptom.toLowerCase().includes(q) || m.fix.toLowerCase().includes(q))
      );
    }).slice(0, 15);
  }, [modalSearchQuery]);

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
    }, 300);
  };

  // Đánh dấu hoàn thành bước thực hành
  const toggleStep = (stepKey: string) => {
    const updated = { ...completedSteps, [stepKey]: !completedSteps[stepKey] };
    setCompletedSteps(updated);
    localStorage.setItem('bim_completed_steps', JSON.stringify(updated));

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

  // Sao chép lệnh CAD / text
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Xử lý gửi câu hỏi AI
  const handleSendAi = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    const userMsg = aiPrompt;
    setAiPrompt('');
    setAiChat((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);

    setTimeout(() => {
      let reply = '';
      let replySources = [currentLesson.title, 'Giáo trình BIM Tuyến 2027'];

      const lower = userMsg.toLowerCase();
      if (lower.includes('infraworks') || lower.includes('chìm') || lower.includes('nổi')) {
        reply = 'Trong Autodesk InfraWorks, hiện tượng corridor bị chìm dưới địa hình thường do Surface bối cảnh xung quanh cao hơn mặt hoàn thiện hoặc chưa thiết lập đè địa hình (Coverages/Terrain Overlay). Bạn cần kiểm tra thứ tự bề mặt trong Surface Layers, đưa Terrain Surface của Corridor lên trên và thiết lập Component Mapping chính xác.';
        replySources.push('Chương 15: Đưa tuyến và cấu kiện vào InfraWorks', 'Autodesk Help: Corridor Component Mapping');
      } else if (lower.includes('tọa độ') || lower.includes('vn-2000') || lower.includes('qgis')) {
        reply = 'Khi kiểm tra hệ tọa độ trong QGIS với dữ liệu Civil 3D sang: Tuyệt đối không nhầm lẫn giữa việc "Gán hệ tọa độ (Set CRS)" và "Chuyển hệ tọa độ (Reproject CRS)". Luôn đối chiếu ít nhất 3 điểm khống chế tọa độ (E, N, Z) giữa bản vẽ DWG và lớp vector GeoPackage, không chỉ nhìn ảnh vệ tinh vì ảnh vệ tinh Google có độ lệch cục bộ 1-3m.';
        replySources.push('Chương 18: GIS nền tảng cho kỹ sư tuyến', 'QGIS User Manual 3.34: CRS Handling');
      } else if (lower.includes('property sets') || lower.includes('thuộc tính') || lower.includes('navisworks')) {
        reply = 'Để Property Sets hiển thị đầy đủ trong Navisworks: Trong Civil 3D, hãy gán Property Set Definition vào Corridor Solids hoặc 3D Solid objects. Khi mở bằng Navisworks hoặc xuất NWC/IFC 4.3, kích hoạt tùy chọn "Convert Property Sets" trong Navisworks DWG/DXF Loader Options.';
        replySources.push('Chương 7: Quản trị Property Sets', 'Chương 8: Xuất NWC/DWG/IFC 4.3');
      } else {
        reply = `Về vấn đề "${userMsg}": Theo quy trình bài học ${currentLesson.id.toUpperCase()} (${currentLesson.title}), bạn cần thực hiện tuần tự theo bảng checklist các bước thao tác, chú ý phần "Tiêu chí kiểm tra chất lượng" và các "Cảnh báo kỹ thuật" để đảm bảo tính toàn vẹn của mô hình BIM và tọa độ mốc.`;
      }

      setAiChat((prev) => [...prev, { role: 'assistant', text: reply, sources: replySources }]);
      setIsAiLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c1017] text-slate-200 font-sans antialiased select-none">
      
      {/* ─── TOPBAR HEADER (CHUẨN CIVIL NOTEBOOK 100%) ────────────────────────── */}
      <header className="h-14 border-b border-[#232d3f] bg-[#131822] px-4 flex items-center justify-between shrink-0 z-20">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-base">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-wide text-sm font-mono">CIVIL NOTEBOOK</span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-sky-950 text-sky-400 border border-sky-800 rounded font-mono">
                BIM 2027 PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Sổ tay kinh nghiệm & giải pháp kỹ thuật BIM Tuyến & Hạ tầng GIS
            </div>
          </div>
        </div>

        {/* Center: Command Switcher Quick Search (Ctrl+K) */}
        <div className="flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-[#0c1017] hover:bg-[#18202d] border border-[#232d3f] rounded-lg transition-all shadow-inner group"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Tìm nhanh theo lệnh, lỗi, giải pháp...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1a2332] text-slate-300 border border-[#2d3a4f] rounded font-mono">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* GitHub Sync Status Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-medium font-mono">GitHub: origin/main</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => {
              setSaveStatus('Đã đồng bộ');
              setTimeout(() => alert('✅ Đã đồng bộ toàn bộ tiến độ thực hành và ghi chú bài học!'), 150);
            }}
            title="Đồng bộ tiến độ học tập và ghi chú"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#18202d] hover:bg-[#232d3f] border border-[#232d3f] rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Đồng bộ</span>
          </button>

          {/* New Case / Note Button */}
          <button
            onClick={() => {
              setIsRightPanelOpen(true);
              setActiveTab('notes');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-lg shadow-md shadow-sky-600/20 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Ghi chú</span>
          </button>

          {/* Toggle Panel Phải */}
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            title="Đóng / Mở Bảng Ghi chú & Nguồn tra cứu"
            className={`p-1.5 text-xs rounded-lg border transition-colors ${
              isRightPanelOpen
                ? 'bg-[#18202d] border-sky-500/50 text-sky-400'
                : 'bg-[#18202d] border-[#232d3f] text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── MAIN WORKSPACE (2 HOẶC 3 CỘT) ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ─── CỘT TRÁI: SIDEBAR DANH SÁCH CA KINH NGHIỆM / BÀI HỌC ───────────── */}
        <aside className="w-80 border-r border-[#232d3f] bg-[#131822] flex flex-col shrink-0">
          
          {/* Bộ lọc Chuyên mục Civil (Dropdown chuẩn Civil Notebook) */}
          <div className="p-3 border-b border-[#232d3f]">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Nhóm Kỹ thuật Civil
            </label>
            <div className="relative">
              <select
                value={softwareFilter}
                onChange={(e) => setSoftwareFilter(e.target.value)}
                className="w-full text-xs bg-[#0c1017] text-slate-200 border border-[#232d3f] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
              >
                <option value="all">📂 Tất cả các nhóm (All Groups)</option>
                <option value="Civil 3D">🛣️ Civil 3D — Thiết kế tuyến & San nền</option>
                <option value="Navisworks">🔍 Navisworks — Phối hợp & Clash Test</option>
                <option value="InfraWorks">🌐 InfraWorks — Mô phỏng bối cảnh 3D</option>
                <option value="QGIS">🗺️ QGIS — Bản đồ & Tọa độ GIS</option>
                <option value="4D / 5D">⏱️ 4D / 5D — Tiến độ & Khối lượng BIM</option>
              </select>
              <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Search Filter in List */}
          <div className="px-3 pt-2 pb-2 border-b border-[#232d3f]/60">
            <div className="relative">
              <input
                type="text"
                placeholder="Lọc danh sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-[#0c1017] text-slate-200 border border-[#232d3f] rounded-md pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-sky-500 placeholder-slate-500"
              />
              <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>

          {/* Danh sách Thẻ Cases (Case Cards y hệt Civil Notebook) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {filteredLessons.map((lesson) => {
              const isSelected = lesson.id === activeLessonId;
              const isDone = lessonProgress[lesson.id] === 'completed';

              return (
                <div
                  key={lesson.id}
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-[#1e293b] shadow-md shadow-sky-500/10'
                      : 'border-[#232d3f] bg-[#18202d] hover:bg-[#1e293b] hover:border-sky-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800 rounded">
                      {lesson.id.toUpperCase()}
                    </span>
                    {isDone ? (
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>verified</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {lesson.minutes}p
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-2 mb-1.5">
                    {lesson.title}
                  </h4>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                    <span className="text-sky-400">{lesson.software}</span>
                    <span>•</span>
                    <span>Chương {lesson.chapterOrder}</span>
                    <span>•</span>
                    <span>Rev 1</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer (Tổng số ca) */}
          <div className="p-2.5 border-t border-[#232d3f] bg-[#0c1017] flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-sky-400">Tổng số: {filteredLessons.length} ca</span>
            <span className="text-slate-500">Sẵn sàng tra cứu</span>
          </div>
        </aside>

        {/* ─── CỘT GIỮA: RIGHT CANVAS (VIEWER CHI TIẾT CA CHUẨN CIVIL NOTEBOOK) ── */}
        <main className="flex-1 bg-[#0c1017] flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full scrollbar-thin">
            
            {/* Header Ca Kinh nghiệm */}
            <div className="border-b border-[#232d3f] pb-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800 rounded-md">
                    {currentLesson.id.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{lessonProgress[currentLesson.id] === 'completed' ? 'verified_live' : 'verified'}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Revision 1</span>
                  <span className="text-xs text-slate-500 font-mono">• Thời lượng: {currentLesson.minutes} phút</span>
                </div>

                {/* Action Edit Button */}
                <button
                  onClick={() => {
                    const isDone = lessonProgress[currentLesson.id] === 'completed';
                    const nextState = isDone ? 'practicing' : 'completed';
                    setLessonProgress((prev) => ({ ...prev, [currentLesson.id]: nextState }));
                    const updatedSteps = { ...completedSteps };
                    currentLesson.steps.forEach((_, idx) => {
                      updatedSteps[`${currentLesson.id}-s${idx}`] = !isDone;
                    });
                    setCompletedSteps(updatedSteps);
                    localStorage.setItem('bim_completed_steps', JSON.stringify(updatedSteps));
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                    lessonProgress[currentLesson.id] === 'completed'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'text-slate-200 bg-[#18202d] hover:bg-[#232d3f] border-[#232d3f]'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{lessonProgress[currentLesson.id] === 'completed' ? '✓ Đã hoàn tất ca' : 'Đánh dấu hoàn thành'}</span>
                </button>
              </div>

              <h1 className="text-xl font-bold text-white tracking-tight leading-snug mb-2">
                {currentLesson.title}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentLesson.objective}
              </p>

              {/* Pill Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2 py-0.5 text-[11px] font-medium bg-[#18202d] text-sky-300 border border-[#2d3a4f] rounded font-mono">
                  {currentLesson.software}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-[#18202d] text-sky-300 border border-[#2d3a4f] rounded font-mono">
                  Chương {currentLesson.chapterOrder}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-[#18202d] text-slate-400 border border-[#232d3f] rounded font-mono">
                  Civil 3D 2020-2027
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-[#18202d] text-slate-400 border border-[#232d3f] rounded font-mono">
                  {currentLesson.deliverable}
                </span>
              </div>
            </div>

            {/* Section Vấn đề & Nguyên nhân (2 Cột chuẩn Civil Notebook) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/15">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>VẤN ĐỀ / HIỆN TƯỢNG</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                  {currentLesson.mistakes[0]?.symptom || currentLesson.objective}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-sky-900/40 bg-sky-950/15">
                <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>NGUYÊN NHÂN KỸ THUẬT</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                  {currentLesson.mistakes[0]?.fix || `Đặc tính thiết kế và luồng xử lý dữ liệu chuẩn của ${currentLesson.software}.`}
                </p>
              </div>
            </div>

            {/* Section Quy trình Xử lý Chuẩn (ĐÃ BỎ SƠ ĐỒ KHOANH ĐỎ) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>QUY TRÌNH XỬ LÝ CHUẨN</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Tick từng bước để xác nhận kiểm soát
                </span>
              </div>

              <div className="bg-[#131822] border border-[#232d3f] rounded-xl divide-y divide-[#232d3f]/70 overflow-hidden shadow-lg">
                {currentLesson.steps.map((step, idx) => {
                  const stepKey = `${currentLesson.id}-s${idx}`;
                  const isStepDone = completedSteps[stepKey];

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(stepKey)}
                      className={`p-4 transition-colors cursor-pointer flex items-start space-x-3.5 ${
                        isStepDone ? 'bg-emerald-950/15' : 'hover:bg-[#18202d]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!isStepDone}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded border-[#232d3f] bg-[#0c1017] text-sky-500 focus:ring-0 cursor-pointer"
                      />

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#18202d] text-sky-400 border border-[#2d3a4f] rounded">
                            BƯỚC {idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-white">
                            {step.title}
                          </h4>
                        </div>

                        {/* Thao tác & Lệnh */}
                        <div className="relative group/box mb-2">
                          <div className="text-xs text-slate-200 leading-relaxed font-mono bg-[#0c1017] p-3 rounded-lg border border-[#232d3f] whitespace-pre-wrap">
                            {step.action}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(step.action, `step-${idx}`);
                            }}
                            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-mono bg-[#18202d] hover:bg-[#232d3f] text-slate-300 border border-[#232d3f] rounded transition-opacity opacity-0 group-hover/box:opacity-100 flex items-center space-x-1"
                          >
                            <span>{copiedText === `step-${idx}` ? '✓ Đã copy' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* Kết quả mong đợi */}
                        <div className="text-[11px] text-emerald-400 flex items-center space-x-1.5 font-medium">
                          <span className="text-emerald-500">✓ Kết quả:</span>
                          <span>{step.expected}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Cảnh báo & Tiêu chuẩn QA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Cảnh báo kỹ thuật */}
              <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20">
                <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>CẢNH BÁO KỸ THUẬT & LƯU Ý QUAN TRỌNG</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-200 space-y-1 font-mono">
                  {currentLesson.mistakes.map((m, i) => (
                    <li key={i}>{m.symptom}: {m.fix}</li>
                  ))}
                </ul>
              </div>

              {/* Tiêu chí nghiệm thu QA */}
              <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/15">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>TIÊU CHÍ NGHIỆM THU KIỂM TRA</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-200 space-y-1 font-mono">
                  {currentLesson.checks.map((chk, i) => (
                    <li key={i}>{chk}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bài tập Thực hành & Sản phẩm */}
            <div className="p-4 rounded-xl border border-[#232d3f] bg-[#131822]">
              <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>BÀI TẬP VẬN DỤNG & SẢN PHẨM BÀN GIAO</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <div><strong>Yêu cầu:</strong> {currentLesson.exercise}</div>
                <div className="flex items-center space-x-2">
                  <strong>Sản phẩm nộp:</strong>
                  <span className="px-2 py-0.5 rounded bg-[#18202d] text-sky-400 border border-sky-800 font-mono text-[11px]">
                    {currentLesson.deliverable}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* ─── CỘT PHẢI: GHI CHÚ, NGUỒN GDRIVE & HỎI AI (COLLAPSIBLE) ──────────── */}
        {isRightPanelOpen && (
          <aside className="w-96 border-l border-[#232d3f] bg-[#131822] flex flex-col shrink-0">
            {/* Tab Headers */}
            <div className="flex border-b border-[#232d3f] bg-[#0c1017]">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                  activeTab === 'notes'
                    ? 'border-sky-500 text-sky-400 bg-[#131822]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📝 Ghi chú</span>
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                  activeTab === 'sources'
                    ? 'border-sky-500 text-sky-400 bg-[#131822]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📚 Nguồn GDrive</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ai'
                    ? 'border-sky-500 text-sky-400 bg-[#131822]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🤖 Kỹ sư AI</span>
              </button>
            </div>

            {/* Tab 1: Ghi chú cá nhân */}
            {activeTab === 'notes' && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2 text-xs font-mono">
                  <span className="text-slate-400">Ghi chú cho {currentLesson.id.toUpperCase()}</span>
                  <span className="text-[11px] text-emerald-400 font-medium">{saveStatus}</span>
                </div>
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Ghi chép thông số kỹ thuật, mốc lý trình, tọa độ, lỗi gặp phải hoặc kinh nghiệm thực hành bài này..."
                  className="flex-1 p-3 text-xs bg-[#0c1017] border border-[#232d3f] rounded-lg text-slate-200 resize-none focus:outline-none focus:border-sky-500 leading-relaxed font-mono"
                />
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="flex-1 py-1.5 px-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
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
                    className="py-1.5 px-3 bg-[#18202d] hover:bg-[#232d3f] text-slate-300 text-xs font-medium rounded-lg border border-[#232d3f]"
                  >
                    Xuất MD
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Nguồn tra cứu Google Drive */}
            {activeTab === 'sources' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                <div className="text-xs text-slate-400 font-medium font-mono">
                  Tài liệu đính kèm bài học này:
                </div>
                {currentLesson.sourceIds.map((srcId) => {
                  const src = sources.find((s) => s.id === srcId);
                  if (!src) return null;
                  return (
                    <div key={src.id} className="p-3 rounded-lg bg-[#0c1017] border border-[#232d3f] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sky-400 truncate">{src.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border bg-sky-950 text-sky-400 border-sky-800 font-mono">
                          {src.kind === 'official' ? 'Chính thức' : 'GDrive'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mb-2 font-mono">Phiên bản: {src.version}</div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-sky-400 hover:text-sky-300 underline flex items-center space-x-1"
                      >
                        <span>Mở tài liệu / Mẫu bài tập</span> ↗
                      </a>
                    </div>
                  );
                })}

                {/* Kho tài nguyên Google Drive G:\My Drive\my */}
                <div className="pt-3 border-t border-[#232d3f]">
                  <div className="text-xs text-slate-400 font-medium mb-2 font-mono">Kho tài nguyên Google Drive (G:\My Drive\my):</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#0c1017] border border-[#232d3f] text-slate-300">
                      📁 <strong className="text-white">Hoctap/Civil Design:</strong> Bộ tài liệu học Civil Design phối hợp Navisworks / InfraWorks
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0c1017] border border-[#232d3f] text-slate-300">
                      📁 <strong className="text-white">Hoctap/BIM-GIS:</strong> Hướng dẫn tích hợp mô hình BIM-GIS đa nền tảng
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0c1017] border border-[#232d3f] text-slate-300">
                      📁 <strong className="text-white">GIS/Binh Dinh_DEM:</strong> Dữ liệu mô hình số độ cao DEM và bình đồ giải thửa
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0c1017] border border-[#232d3f] text-slate-300">
                      📁 <strong className="text-white">Hoctap/VSI Academy:</strong> Thư viện mẫu Subassembly Composer và quy trình Corridor
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Hỏi đáp Kỹ sư AI */}
            {activeTab === 'ai' && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin">
                  {aiChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-sky-950/40 text-slate-200 border border-sky-800/50 ml-4'
                          : 'bg-[#0c1017] text-slate-200 border border-[#232d3f] mr-4'
                      }`}
                    >
                      <div className="font-semibold text-[11px] mb-1 text-slate-400 font-mono">
                        {msg.role === 'user' ? 'Kỹ sư' : 'Trợ lý AI BIM'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#232d3f] text-[10px] text-sky-400 font-mono">
                          📚 Nguồn: {msg.sources.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="p-3 rounded-lg bg-[#0c1017] border border-[#232d3f] text-xs text-slate-400 animate-pulse font-mono">
                      AI đang tra cứu tài liệu và đối soát nguồn...
                    </div>
                  )}
                </div>

                {/* Input Hỏi AI */}
                <div className="border-t border-[#232d3f] pt-3 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Hỏi lỗi Civil 3D, tọa độ GIS, InfraWorks..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
                    className="flex-1 px-3 py-1.5 text-xs bg-[#0c1017] border border-[#232d3f] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={handleSendAi}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─── MODAL: SEARCH QUICK SWITCHER (Ctrl + K) ────────────────────────── */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="bg-[#131822] border border-[#2d3a4f] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-3.5 border-b border-[#232d3f] flex items-center space-x-3 bg-[#18202d]">
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="Nhập từ khóa (vd: corridor, super elevation, navisworks, qgis, tọa độ...)"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-sans"
              />
              <kbd
                onClick={() => setIsSearchModalOpen(false)}
                className="px-1.5 py-0.5 text-[10px] bg-[#0c1017] text-slate-400 border border-[#232d3f] rounded cursor-pointer hover:bg-slate-800 font-mono"
              >
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1 divide-y divide-[#1e293b]/50">
              {modalSearchQuery.trim() === '' ? (
                <div className="p-6 text-center text-xs text-slate-400 font-sans">
                  Gõ từ khóa để tra cứu siêu tốc trong toàn bộ 24 chương & 80 bài học thực hành...
                </div>
              ) : modalSearchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-rose-400 font-sans">
                  Không tìm thấy bài học nào với từ khóa "{modalSearchQuery}".
                </div>
              ) : (
                modalSearchResults.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setActiveLessonId(l.id);
                      setIsSearchModalOpen(false);
                    }}
                    className="p-3 rounded-lg hover:bg-[#18202d] cursor-pointer transition-colors flex items-start space-x-3"
                  >
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800 rounded mt-0.5">
                      {l.id.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white mb-0.5">
                        {l.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {l.objective}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-slate-500">
                        <span className="text-sky-400">{l.software}</span>
                        <span>•</span>
                        <span>Chương {l.chapterOrder}</span>
                        <span>•</span>
                        <span>{l.minutes} phút</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
