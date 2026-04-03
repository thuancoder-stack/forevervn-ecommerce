import React, { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import defaultChime from '../assets/iPhone ding - sound effect.mp3'
import deleteChime from '../assets/sound effect COMMANDS   DELETE.mp3'

const MIN_CHIME_GAP_MS = 180
const PATCHED_TOAST_SOUND = '__foreverToastSoundPatched'
const TOAST_METHODS = ['success', 'error', 'info', 'warn', 'loading']

const DELETE_KEYWORDS = [
  'delete',
  'deleted',
  'remove',
  'removed',
  'xoa',
  'xóa',
  'da xoa',
  'đã xóa',
  'huy',
  'hủy',
]

const extractToastText = (value) => {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(extractToastText).join(' ')
  if (React.isValidElement(value)) return extractToastText(value.props?.children)
  if (typeof value === 'object') return extractToastText(value.children ?? value.content)
  return ''
}

const getSoundType = (content) => {
  const text = extractToastText(content).toLowerCase()
  return DELETE_KEYWORDS.some((keyword) => text.includes(keyword)) ? 'delete' : 'default'
}

const ToastSoundBridge = () => {
  const defaultAudioRef = useRef(null)
  const deleteAudioRef = useRef(null)
  const unlockedRef = useRef(false)
  const pendingSoundRef = useRef(null)
  const lastPlayedAtRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const ensureAudio = (soundType) => {
      const isDelete = soundType === 'delete'
      const targetRef = isDelete ? deleteAudioRef : defaultAudioRef
      const source = isDelete ? deleteChime : defaultChime

      if (!targetRef.current) {
        const audio = new Audio(source)
        audio.preload = 'auto'
        audio.volume = 1
        targetRef.current = audio
      }

      return targetRef.current
    }

    const runChime = (soundType = 'default') => {
      const now = Date.now()
      if (now - lastPlayedAtRef.current < MIN_CHIME_GAP_MS) return
      lastPlayedAtRef.current = now

      const audio = ensureAudio(soundType).cloneNode()
      audio.volume = 1
      audio.currentTime = 0

      const playPromise = audio.play?.()
      if (playPromise?.catch) {
        playPromise.catch(() => {
          pendingSoundRef.current = soundType
        })
      }

      pendingSoundRef.current = null
    }

    const requestChime = (soundType = 'default') => {
      if (!unlockedRef.current) {
        pendingSoundRef.current = soundType
        return
      }

      runChime(soundType)
    }

    const unlockAudio = () => {
      unlockedRef.current = true
      ensureAudio('default').load()
      ensureAudio('delete').load()

      if (pendingSoundRef.current) {
        runChime(pendingSoundRef.current)
      }
    }

    const originals = []

    if (!toast[PATCHED_TOAST_SOUND]) {
      TOAST_METHODS.forEach((methodName) => {
        if (typeof toast[methodName] !== 'function') return

        const original = toast[methodName].bind(toast)
        originals.push([methodName, original])

        toast[methodName] = (...args) => {
          requestChime(getSoundType(args[0]))
          return original(...args)
        }
      })

      toast[PATCHED_TOAST_SOUND] = true
    }

    const unsubscribe = toast.onChange?.((payload) => {
      if (payload?.status === 'added') {
        requestChime(getSoundType(payload?.content))
      }
    })

    const unlockEvents = ['pointerdown', 'click', 'keydown', 'touchstart']
    unlockEvents.forEach((eventName) => {
      window.addEventListener(eventName, unlockAudio, true)
      document.addEventListener(eventName, unlockAudio, true)
    })

    return () => {
      unsubscribe?.()
      originals.forEach(([methodName, original]) => {
        toast[methodName] = original
      })
      toast[PATCHED_TOAST_SOUND] = false
      unlockEvents.forEach((eventName) => {
        window.removeEventListener(eventName, unlockAudio, true)
        document.removeEventListener(eventName, unlockAudio, true)
      })
      ;[defaultAudioRef.current, deleteAudioRef.current].forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.src = ''
        }
      })
    }
  }, [])

  return null
}

export default ToastSoundBridge
