import { UiText } from '../i18n/UiText';

// Segmented control for the views inside a navigation group.
export function SubNav({ views, active, onSelect }) {
  const onKeyDown = (e) => {
    const i = views.findIndex((v) => v.id === active);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    onSelect(views[(i + step + views.length) % views.length].id);
  };
  return (
    <div className="sub-nav" role="tablist" onKeyDown={onKeyDown}>
      {views.map(({ id }) => (
        <button
          key={id}
          role="tab"
          aria-selected={active === id}
          tabIndex={active === id ? 0 : -1}
          className={`sub-nav-btn${active === id ? ' active' : ''}`}
          onClick={() => onSelect(id)}
        >
          <UiText k={`tab.${id.toLowerCase()}`} />
        </button>
      ))}
    </div>
  );
}
