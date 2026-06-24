import { Link, useLocation } from 'react-router-dom';

/** 全站「玩法说明」入口 — 固定右上角 */
export function HowToPlayEntry() {
  const location = useLocation();
  if (location.pathname === '/how-to-play') return null;

  const from = `${location.pathname}${location.search}`;

  return (
    <div className="how-to-play-entry-wrap" aria-hidden={false}>
      <Link to="/how-to-play" state={{ from }} className="how-to-play-entry">
        玩法说明
      </Link>
    </div>
  );
}
