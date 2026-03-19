import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server'
import { createRouter } from '../src/router'

export default createStartHandler({
  createRouter,
})(defaultStreamHandler)
