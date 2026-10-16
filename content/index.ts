import { bimChapters, bimSources } from './bim';
import { infraGisChapters, infraGisSources } from './infra-gis';
export const chapters = [...bimChapters, ...infraGisChapters].sort((a, b) => a.order - b.order);
export const sources = [...bimSources, ...infraGisSources].filter((item, i, all) => all.findIndex(s => s.id === item.id) === i);
export const lessons = chapters.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapterId: chapter.id, chapterTitle: chapter.title, software: chapter.software, chapterOrder: chapter.order })));
