import styles from './Avatar.module.css';

type Size = 'xs' | 'sm' | 'md' | 'lg';
type Variant = 'neutral' | 'primary';

interface AvatarProps {
	name: string;
	size?: Size;
	variant?: Variant;
	online?: boolean;
	className?: string;
}

export function Avatar({ name, size = 'md', variant = 'neutral', online = false, className }: AvatarProps) {
	const initial = (name?.trim()?.charAt(0) || '?').toUpperCase();
	const classes = [styles.root, styles[size], styles[variant], className].filter(Boolean).join(' ');
	return (
		<div className={classes} aria-label={`Аватар ${name}`}>
			{initial}
			{online && <div className={`${styles.onlineDot} ${size === 'xs' ? styles.dotSm : ''}`}></div>}
		</div>
	);
}

