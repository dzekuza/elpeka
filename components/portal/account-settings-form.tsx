'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { LockKey } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Vardas privalomas'),
  phone: z.string().min(1, 'Telefono numeris privalomas'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Dabartinis slaptažodis privalomas'),
    newPassword: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių'),
    confirmPassword: z.string().min(1, 'Patvirtinkite naują slaptažodį'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Slaptažodžiai nesutampa',
    path: ['confirmPassword'],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

interface Props {
  initialFullName: string
  initialPhone: string
  email: string
}

export function AccountSettingsForm({ initialFullName, initialPhone, email }: Props) {
  const supabase = createClient()

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: initialFullName, phone: initialPhone },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function onSaveProfile(values: ProfileValues) {
    setProfileLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: values.fullName, phone: values.phone },
    })
    setProfileLoading(false)
    if (error) {
      toast.error('Klaida išsaugant profilio informaciją')
    } else {
      toast.success('Profilio informacija išsaugota')
    }
  }

  async function onUpdatePassword(values: PasswordValues) {
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: values.newPassword })
    setPasswordLoading(false)
    if (error) {
      toast.error('Klaida atnaujinant slaptažodį')
    } else {
      toast.success('Slaptažodis atnaujintas')
      passwordForm.reset()
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-medium tracking-tight">Profilio informacija</CardTitle>
          <CardDescription>Atnaujinkite savo asmeninius duomenis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Vardas Pavardė</Label>
                <Input
                  id="fullName"
                  placeholder="Vardas Pavardė"
                  {...profileForm.register('fullName')}
                />
                {profileForm.formState.errors.fullName && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">El. paštas</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="pr-10"
                  />
                  <LockKey className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-foreground/40" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Tel. numeris</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+370 600 00000"
                  {...profileForm.register('phone')}
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saugoma...' : 'Išsaugoti pakeitimus'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-medium tracking-tight">Saugumas</CardTitle>
          <CardDescription>Pakeiskite savo slaptažodį</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Dabartinis slaptažodis</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Įveskite dabartinį slaptažodį"
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">Naujas slaptažodis</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Įveskite naują slaptažodį"
                  {...passwordForm.register('newPassword')}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Patvirtinkite naują slaptažodį</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Pakartotinai įveskite naują slaptažodį"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Atnaujinama...' : 'Atnaujinti'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
