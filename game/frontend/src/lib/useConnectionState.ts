import { useEffect, useState } from 'react'
import { getConnectionState, onConnectionStateChange, type ConnectionState } from './socket'

export function useConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(getConnectionState())

  useEffect(() => {
    setState(getConnectionState())
    return onConnectionStateChange(setState)
  }, [])

  return state
}
