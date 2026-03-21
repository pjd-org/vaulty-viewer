import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { createRouter } from '../src/router'

export default createStartHandler({
  createRouter,
})(defaultStreamHandler)
