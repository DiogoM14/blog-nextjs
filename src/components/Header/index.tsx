import Link from 'next/link'
import commonStyles from '../../styles/common.module.scss'
import styles from './header.module.scss'

export function Header() {
  return (
    <>
      <div className={commonStyles.containerCommon}>
        <Link href="/">
          <img className={styles.headerImage} src="/logo.svg" alt="logo"/>
        </Link>
      </div>
    </>
  )
}
