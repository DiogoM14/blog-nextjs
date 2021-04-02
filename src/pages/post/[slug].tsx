import { GetStaticPaths, GetStaticProps } from 'next';
import { redirect } from 'next/dist/next-server/server/api-utils';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

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
  const date = post.first_publication_date
  const title = post.data.title
  const author = post.data.author
  const content = post.data.content

  return (
    <>
      <img src={post.data.banner.url} alt=""/>

      <article className={commonStyles.containerCommon}>
        <h1>{title}</h1>
        <div>
          <span>
            <FiCalendar />
            <p>{date}</p>
          </span>
          <span>
            <FiUser />
            <p>{author}</p>
          </span>
          <span>
            <FiClock />
            <p>4 min</p>
          </span>
        </div>

        { post?.data?.content?.map(content => (
          <div
            key={content.heading}
            dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
          />
        )) }


      </article>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // const prismic = getPrismicClient()
  // const posts = await prismic.query([
  //   Prismic.predicates.at('document.type', 'posts'),
  // ], {
  //   fetch: ['posts.uid'],
  //   pageSize: 100,
  // })

  // const results = posts.results.map(post => {
  //   return {
  //     id: post.uid
  //   }
  // })

  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params

  const prismic = getPrismicClient()
  const response = await prismic.getByUID('posts', String(slug), {})

  // console.log(JSON.stringify(response, null, 2))

  const post = {
    uid: response.uid,
    first_publication_date: new Date(response.first_publication_date).toLocaleDateString('pt', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
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
