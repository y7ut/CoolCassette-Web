import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const SCROLL_KEY = 'cc_list_scroll'
const SORT_KEY = 'cc_list_sort'

export function saveListState(sortBy?: string, order?: string) {
  sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
  if (sortBy && order) {
    sessionStorage.setItem(SORT_KEY, JSON.stringify({ sortBy, order }))
  }
}

export function getListState() {
  const scroll = sessionStorage.getItem(SCROLL_KEY)
  const sort = sessionStorage.getItem(SORT_KEY)
  return {
    scrollY: scroll ? parseInt(scroll) : 0,
    sort: sort ? JSON.parse(sort) : null,
  }
}

export function clearListState() {
  sessionStorage.removeItem(SCROLL_KEY)
  sessionStorage.removeItem(SORT_KEY)
}

export default function ScrollRestoration() {
  const location = useLocation()
  const navType = useNavigationType()
  const restoredRef = useRef(false)

  useEffect(() => {
    if (location.pathname === '/' && navType === 'POP') {
      // Returning to list page via back button
      const state = getListState()
      if (state.scrollY > 0) {
        // Wait for DOM to render with restored data
        const timer = setTimeout(() => {
          window.scrollTo({ top: state.scrollY, behavior: 'instant' })
          clearListState()
        }, 50)
        restoredRef.current = true
        return () => clearTimeout(timer)
      }
    }

    if (location.pathname.startsWith('/album/')) {
      restoredRef.current = false
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.pathname, navType])

  return null
}
