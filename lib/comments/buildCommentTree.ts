// Групування плаского списку коментарів у дерево "корінь + відповіді"
// (задача F.25.6, частина роботи над відповідями на коментарі F.25.1–F.25.9).
// Приймає плаский `Comment[]` (як зараз повертає
// `getCommentsByLessonIdService`/лежить у `RealCommentsBlock.comments`) і
// повертає масив кореневих коментарів (`parentId === null`), кожен зі своїм
// масивом `replies` (усі коментарі з `parentId === root.id`).
//
// Глибина вкладеності обмежена одним рівнем на рівні `service.ts`
// (`addCommentService`, F.25.4) — тому тут НЕ потрібна рекурсія: відповідь
// на відповідь уже прийшла з сервера з `parentId`, що вказує на корінь, а
// не на проміжного "батька".
//
// Сортування:
// - Кореневі — як і раніше (найновіші зверху, `createdAt` спадаюче,
//   поведінка задачі 6.5.14 не змінюється); порядок вхідного масиву
//   зберігається без додаткової сортування тут — виклик очікує, що масив
//   уже відсортований (`sortedComments` у `RealCommentsBlock`).
// - Відповіді всередині кожної групи — сортуються `createdAt` ЗРОСТАЮЧЕ
//   (найстаріша відповідь першою, як у типовій гілці обговорення):
//   порядок відповіді в її власній групі залежить лише від того, КОЛИ вона
//   з'явилась відносно інших відповідей ТІЄЇ Ж гілки, а не від положення
//   серед усіх коментарів уроку.

import type { Comment } from "@/modules/comments";

export interface CommentTreeNode {
  root: Comment;
  replies: Comment[];
}

function toTime(createdAt: Comment["createdAt"]): number {
  return createdAt instanceof Date ? createdAt.getTime() : Date.parse(createdAt);
}

/**
 * Групує плаский `comments` (очікується вже відсортованим найновішими
 * коментарями зверху — порядок коренів у результаті збігається з порядком
 * вхідного масиву) у масив кореневих вузлів з відповідями.
 */
export function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  const roots = comments.filter((comment) => comment.parentId === null);
  const repliesByParentId = new Map<string, Comment[]>();

  for (const comment of comments) {
    if (comment.parentId === null) continue;
    const bucket = repliesByParentId.get(comment.parentId);
    if (bucket) {
      bucket.push(comment);
    } else {
      repliesByParentId.set(comment.parentId, [comment]);
    }
  }

  return roots.map((root) => {
    const replies = repliesByParentId.get(root.id) ?? [];
    replies.sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
    return { root, replies };
  });
}
