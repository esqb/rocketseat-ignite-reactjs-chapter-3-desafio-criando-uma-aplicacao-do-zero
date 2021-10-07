import { GetStaticPaths, GetStaticProps } from 'next';

import Head from 'next/head';
import { IconContext } from 'react-icons';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const { author, banner, title, content } = post.data;
  const first_publication_date = format(
    new Date(post.first_publication_date),
    'dd MMM uuuu',
    { locale: ptBR }
  );

  let entireContent = '';
  const regex = /[\s]/gimu;

  post.data.content.forEach(postContent => {
    entireContent += `${postContent.heading} `;
    entireContent += RichText.asText(postContent.body);
  });

  const wordsInContent = entireContent.split(regex).length;

  const timeToRead = Math.ceil(wordsInContent / 200);

  return (
    <main className={styles.post}>
      <img src={banner.url} alt="Banner do post" />

      <article className={styles.postContainer}>
        <strong>{title}</strong>

        <div className={styles.info}>
          <FiCalendar size={20} />
          <time>{first_publication_date}</time>
          <FiUser size={20} />
          <h6>{author}</h6>
          <FiClock size={20} />
          <h6>{timeToRead} min</h6>
        </div>

        {content.map(postContent => (
          <div key={postContent.heading} className={styles.postContent}>
            <h2>{postContent.heading}</h2>

            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(postContent.body),
              }}
            />
          </div>
        ))}
      </article>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts2')],
    {
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts2', String(slug), {});

  console.log(JSON.stringify(response, null, 2));

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
