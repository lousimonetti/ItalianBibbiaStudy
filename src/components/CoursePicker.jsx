import { listCourses, getActiveId, setActiveCourse } from '../../courses/registry';

// Header course switcher. Renders nothing unless two or more courses are
// registered (so single-course deploys are unchanged). Switching persists the
// choice and reloads — the whole app then re-resolves to the new course (and its
// own namespaced progress/srs/streak/…).
export function CoursePicker() {
  const courses = listCourses();
  if (courses.length <= 1) return null;

  return (
    <select
      className="course-picker"
      value={getActiveId()}
      aria-label="Switch course"
      onChange={(e) => setActiveCourse(e.target.value)}
    >
      {courses.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}
