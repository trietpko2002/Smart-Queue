import { useEffect, useState } from 'react'
import { createClient } from '@/src/utils/supabase/client'

export default function Page() {
    const [todos, setTodos] = useState<{ id: string; name: string }[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createClient()
        supabase
            .from('todos')
            .select()
            .then(({ data, error }) => {
                if (error) setError(error.message)
                else setTodos(data ?? [])
            })
    }, [])

    if (error) return <p>Lỗi: {error}</p>

    return (
        <ul>
            {todos.map((todo) => (
                <li key={todo.id}>{todo.name}</li>
            ))}
        </ul>
    )
}