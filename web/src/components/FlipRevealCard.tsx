import { useEffect, useState } from 'react';
import { getAvatarEmoji } from '@shared/constants/avatars';

interface Props {
  index: number;
  name: string;
  avatarId: number;
  cardNumber: number;
  revealed: boolean;
  cracked: boolean;
  borderColor?: string;
}

export function FlipRevealCard({
  index,
  name,
  avatarId,
  cardNumber,
  revealed,
  cracked,
  borderColor,
}: Props) {
  const [justRevealed, setJustRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) {
      setJustRevealed(false);
      return;
    }
    setJustRevealed(true);
    const timer = setTimeout(() => setJustRevealed(false), 400);
    return () => clearTimeout(timer);
  }, [revealed]);

  const style = borderColor ? { borderColor } : undefined;

  return (
    <div className="flip-wrap">
      <span className="flip-wrap__index">{index + 1}</span>
      <div
        className={`flip-card${revealed ? ' flip-card--revealed' : ''}${cracked ? ' flip-card--cracked' : ''}${justRevealed ? ' flip-card--anim' : ''}`}
        style={style}
      >
        {!revealed ? (
          <div className="flip-card__back">
            <span className="flip-card__emoji">{getAvatarEmoji(avatarId)}</span>
            <span className="flip-card__name">{name}</span>
          </div>
        ) : (
          <div className={`flip-card__front${cracked ? ' flip-card__front--fail' : ''}`}>
            <span className="flip-card__num">{cardNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}
