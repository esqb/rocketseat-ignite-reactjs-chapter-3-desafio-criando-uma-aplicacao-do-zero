import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { IconContext } from 'react-icons';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  function handleLoadMorePosts(evt: React.MouseEvent<HTMLButtonElement>): void {
    console.log('Button Clicked');
  }

  return (
    <>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {postsPagination.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.metaData}>
                  <IconContext.Provider
                    value={{ className: 'homeMetaDataIcons' }}
                  >
                    <time>
                      <FiCalendar />
                      {post.first_publication_date}
                    </time>
                    <span className={styles.postAuthor}>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </IconContext.Provider>
                </div>
              </a>
            </Link>
          ))}
          {postsPagination.next_page && (
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 5,
    }
  );

  const posts = response.results.map(post => {
    const formattedDate = format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    );
    return {
      uid: post.uid,
      first_publication_date: formattedDate,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: response.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
