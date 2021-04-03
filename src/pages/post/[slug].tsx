import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { Header } from '../../components/Header';

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

export default function Post({ post }: PostProps) {
  const router = useRouter()

  return (
    <>
      {router.isFallback ? (
        <h1>Carregando...</h1>
      ) : (
        <>
        <Head>
          <title>{ post.data.title } | Space Travelling</title>
        </Head>

        <Header />

        <img className={styles.banner} src={post.data.banner.url} alt={post.data.title} />

        <article className={`${commonStyles.containerCommon} ${styles.containerPost}`}>
          <h1>{post.data.title}</h1>
          <div>
            <span>
              <FiCalendar />
              <time>{post.first_publication_date}</time >
            </span>
            <span>
              <FiUser />
              <p>{post.data.author}</p>
            </span>
            <span>
              <FiClock />
              <p>4 min</p>
            </span>
          </div>

          { post?.data?.content?.map(content => (
            <div
              className={styles.postContent}
              key={content.heading}
              dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
            />
          )) }
        </article>
        </>
      )}
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient()
  const { results } = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    pageSize: 2,
  })

  return {
    paths: results?.map(({ slugs }) => `/post/${slugs}`) || [],
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params

  const prismic = getPrismicClient()
  const response = await prismic.getByUID('posts', String(slug), {})

  // console.log(JSON.stringify(response, null, 2))

  const post = {
    uid: response.uid,
    first_publication_date: format(new Date(response.first_publication_date),
    "dd MMM yyyy",
    {
      locale: ptBR,
    }),
    data: {
      title: RichText.asText(response.data.title),
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: RichText.asText(response.data.author),
      content: response.data.content,
    },
  }

  return {
    props: {
      post,
    },
    redirect: 60 * 30,
  }
}
