import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BounceLoader from 'react-spinners/BounceLoader';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  navigation: {
    prevPost?: {
      uid: string;
      data: {
        title: string;
      };
    } | null;
    nextPost?: {
      uid: string;
      data: {
        title: string;
      };
    } | null;
  };
}

export default function Post({
  post,
  preview,
  navigation,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={commonStyles.loading}>
        <BounceLoader color="#FF57B2" loading={router.isFallback} size={60} />
        Carregando...
      </div>
    );
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    let result = total;
    result += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    // eslint-disable-next-line array-callback-return
    words.map(word => {
      result += word;
    });

    return result;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  const formattedPublicationDate = format(
    new Date(post.first_publication_date),
    'd MMM yyyy',
    { locale: ptBR }
  );

  const formattedLastEditDate = format(
    new Date(post.last_publication_date),
    "d MMM yyyy ', às' HH:mm",
    { locale: ptBR }
  );

  console.log(formattedLastEditDate);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <Header />

      <div
        className={styles.postImage}
        style={{ backgroundImage: `url(${post.data.banner.url})` }}
      />

      <div className={`${styles.postContainer} ${commonStyles.commom}`}>
        <article className={styles.post}>
          <header>
            <h1>{post.data.title}</h1>
            <div>
              <time>
                <FiCalendar />
                {formattedPublicationDate}
              </time>
              <span>
                <FiUser />
                {post.data.author}
              </span>
              <span>
                <FiClock />
                {readingTime} min
              </span>
            </div>
            <p>* editado em {formattedLastEditDate}</p>
          </header>

          {post.data.content.map((content, index) => (
            <div key={content.heading} className={styles.postContent}>
              <h2>{content.heading}</h2>

              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>

        <footer>
          <span className={styles.divider} />
          <div className={styles.posts}>
            {!!navigation.prevPost && (
              <Link href={`/post/${navigation.prevPost?.uid}`}>
                <a className={styles.prevPost}>
                  {navigation.prevPost.data.title}
                  <strong>Post anterior</strong>
                </a>
              </Link>
            )}
            {!!navigation.nextPost && (
              <Link href={`/post/${navigation.nextPost.uid}`}>
                <a className={styles.nextPost}>
                  {navigation.nextPost.data.title}
                  <strong>Próximo post</strong>
                </a>
              </Link>
            )}
          </div>

          <Comments />
        </footer>

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a>Sair do modo preview</a>
            </Link>
          </aside>
        )}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

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

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
  preview = false,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(item => {
        return {
          heading: item.heading,
          body: [...item.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
      navigation: {
        prevPost: prevPost?.results[0] || null,
        nextPost: nextPost?.results[0] || null,
      },
    },
    revalidate: 60 * 20, // 20 minutos
  };
};
