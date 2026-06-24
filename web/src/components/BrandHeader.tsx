import logoUrl from '../assets/logo-256.png';

interface Props {
  variant?: 'full' | 'compact';
  showLogo?: boolean;
}

export function BrandHeader({ variant = 'full', showLogo = true }: Props) {
  const isCompact = variant === 'compact';

  return (
    <header className={`brand-header${isCompact ? ' brand-header--compact' : ''}`}>
      {showLogo && !isCompact ? (
        <img
          className="brand-header__logo"
          src={logoUrl}
          alt=""
          width={64}
          height={64}
          draggable={false}
        />
      ) : null}
      <h1 className="brand-header__title">Guess Master</h1>
      <p className="brand-header__subtitle">脑波专家</p>
    </header>
  );
}
