import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <img src="Logo.svg" alt="logo" />
      </div>
    </header>
  );
}
