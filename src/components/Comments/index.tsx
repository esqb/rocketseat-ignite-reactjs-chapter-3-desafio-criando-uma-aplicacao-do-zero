import styles from './styles.module.scss';

export const Comments: React.FC = () => (
  <section
    className={styles.comments}
    ref={elem => {
      if (!elem) {
        return;
      }
      const scriptElem = document.createElement('script');
      scriptElem.src = 'https://utteranc.es/client.js';
      scriptElem.async = true;
      scriptElem.crossOrigin = 'anonymous';
      scriptElem.setAttribute('repo', 'Rellyso/utterances-spacetraveling');
      scriptElem.setAttribute('issue-term', 'pathname');
      scriptElem.setAttribute('label', 'blog-comment');
      scriptElem.setAttribute('theme', 'dark-blue');
      elem.appendChild(scriptElem);
    }}
  />
);
