import {createFileRoute} from '@tanstack/react-router'
import {AuthPage} from '@/kurio/Auth'
export const Route=createFileRoute('/register')({component:()=> <AuthPage mode="register"/>})
