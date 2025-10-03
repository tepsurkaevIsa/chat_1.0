import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './SearchInput.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
	icon?: ReactNode;
	wrapperClassName?: string;
};

export function SearchInput({ icon, wrapperClassName, className, ...inputProps }: Props) {
	return (
		<div className={[styles.root, wrapperClassName].filter(Boolean).join(' ')}>
			{icon && <span className={styles.icon}>{icon}</span>}
			<input className={[styles.input, className].filter(Boolean).join(' ')} {...inputProps} />
		</div>
	);
}

