import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link'

import { FiCalendar, FiUser, FiClock, FiEyeOff } from 'react-icons/fi'

import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import { Client } from '../api/preview'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useEffect } from 'react';

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

export default function Post({ post, preview, pagination }) {
  const router = useRouter()

  useEffect(() => {
    let script = document.createElement("script")
    let anchor = document.getElementById("inject-comments-for-uterances")
    script.setAttribute("src", "https://utteranc.es/client.js")
    script.setAttribute("crossorigin","anonymous")
    script.setAttribute("async", "true")
    script.setAttribute("repo", "diogom14/blog-nextjs")
    script.setAttribute("issue-term", "pathname")
    script.setAttribute( "theme", "github-dark")
    anchor.appendChild(script)
  }, [])

  return (
    <>
      <Head>
        <title>{ post?.data?.title } | Space Travelling</title>
      </Head>

      <Header />

      {preview && (
        <Link href="/">
          <a className={styles.exitPreviewButton}>
            <FiEyeOff color="#F8F8F8" />
          </a>
        </Link>
      )}

      {router.isFallback ? (
        <h1>Carregando...</h1>
      ) : (
        <>
          <img className={styles.banner} src={post?.data?.banner?.url} alt={post?.data?.title} />

          <article className={`${commonStyles.containerCommon} ${styles.containerPost}`}>
            <h1>{post?.data?.title}</h1>
            <div>
              <span>
                <FiCalendar />
                <time>
                  {format(new Date(post?.first_publication_date),
                  "dd MMM yyyy",
                  {locale: ptBR})}
                </time>
              </span>
              <span>
                <FiUser />
                <p>{post?.data?.author}</p>
              </span>
              <span>
                <FiClock />
                <p>4 min</p>
              </span>
            </div>

            { post?.data?.content?.map(content => (
              <div className={styles.postContent} key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
                />
              </div>
            )) }

            <div id="inject-comments-for-uterances"></div>

            <hr className={styles.separator} />

            {pagination && (
              <section className={styles.nextPage}>
                {pagination.prePage && (
                  <Link href={pagination.nextPage.href}>
                    <div>
                      <p>{pagination.prevPage.title}</p>
                      <a>Post anterior</a>
                    </div>
                  </Link>
                )}

              {pagination.nextPage && (
                <Link href={pagination.nextPage.href}>
                  <div>
                    <p>{pagination.nextPage.title}</p>
                    <a>Proximo post</a>
                  </div>
                </Link>
              )}
            </section>
            )}
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

  const paths = results.map(post => ({
    params: {
      slug: post.uid
    }
  }))

  return {
    fallback: true,
    paths,
  }
}

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  // preview - Caso seja true, renderiza o botão de exit-preview
  // previewData - possui um cookie

  const { slug } = params

  const prismic = getPrismicClient()
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  })

  console.log(JSON.stringify(response, null, 2))

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  }

  const { results: [nextPage] } = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')], {
    after: response.id,
    orderings: '[document.first_publication_date]',
  });

  const { results: [prevPage] } = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')], {
    after: response.id,
    orderings: '[document.first_publication_date desc]',
  });

  const pagination = {
    nextPage: nextPage
      ? {
          title: nextPage.data.title,
          href: `/post/${nextPage.uid}`,
        }
      : null,
    prevPage: prevPage
      ? {
          title: prevPage.data.title,
          href: `/post/${prevPage.uid}`,
        }
      : null,
  };

  return {
    props: {
      post,
      preview,
      pagination: nextPage || prevPage ? pagination : null,
    },
    redirect: 60 * 30,
  }
}
