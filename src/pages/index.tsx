import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link'
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi'

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';

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

export default function Home(props: HomeProps) {
  // console.log(JSON.stringify(props, null, 2))

  return (
    <>
    <Head>
      <title>Home | Space Travelling</title>
    </Head>

    <div className={`${commonStyles.containerCommon} ${styles.containerHome}`}>

      { props.postsPagination.results.map(post => (
        <Link href={`/post/${post.uid}`}>
          <main className={styles.containerPost} key={post.uid}>
            <a>{post.data.title}</a>
            <p>{post.data.subtitle}</p>

            <div className={styles.postInfo}>
              <span>
                <FiCalendar color="#BBBBBB" />
                <time>{post.first_publication_date}</time>
              </span>

              <span>
                <FiUser color="#BBBBBB" />
                <p>{post.data.author}</p>
              </span>
            </div>
          </main>
        </Link>
      )) }

      { props.postsPagination.next_page !== null && <h2>Carregar mais posts</h2> }
    </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.next_page'],
    pageSize: 2,
  })

  const next_page = postsResponse.next_page

  const results = postsResponse.results.map(post => {
    return {

        uid: post.uid,
        first_publication_date: new Date(post.first_publication_date).toLocaleDateString('pt', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
        data: {
          title: RichText.asText(post.data.title),
          subtitle: RichText.asText(post.data.subtitle),
          author: RichText.asText(post.data.author),
        },

    }
  })

  // console.log(results)

  return {
    props: {
      postsPagination: {
        next_page,
        results
      }
    }
  }
}
