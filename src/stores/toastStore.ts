import { create } from 'zustand'

export type ToastType = 'error' | 'success' | 'info'
export type ToastPosition = 'top-right' | 'center'
export type ToastBorderSide = 'left' | 'top'

export interface ToastOptions {
  type?: ToastType
  position?: ToastPosition
  borderSide?: ToastBorderSide
}

export interface Toast {
  id: number
  message: string
  type: ToastType
  position: ToastPosition
  borderSide: ToastBorderSide
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, opts?: ToastOptions) => void
  removeToast: (id: number) => void
}

let nextId = 0

const defaults: ToastOptions = {
  type: 'info',
  position: 'top-right',
  borderSide: 'left',
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, opts) => {
    const id = nextId++
    const o = { ...defaults, ...opts }
    set((s) => ({ toasts: [...s.toasts, { id, message, type: o.type!, position: o.position!, borderSide: o.borderSide! }] }))
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export function toast(message: string, opts?: ToastOptions) {
  useToastStore.getState().addToast(message, opts)
}
