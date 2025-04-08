"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { UserType } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useLanguage } from "@/lib/i18n/language-context"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserFormProps {
  user: UserType | null
  onSubmit: (user: UserType) => void
  onCancel: () => void
}

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<UserType & { password?: string }>({
    id: user?.id || 0,
    username: user?.username || "",
    isAdmin: user?.isAdmin || false,
    password: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isAdmin: checked }))
  }

  const validateForm = (): boolean => {
    // Username validation
    if (!formData.username.trim()) {
      setError(t("usernameRequired"))
      return false
    }

    if (formData.username.length < 3 || formData.username.length > 50) {
      setError(t("usernameLength"))
      return false
    }

    // Password validation for new users or when changing password
    if (!user || formData.password) {
      if (!user && !formData.password) {
        setError(t("passwordRequired"))
        return false
      }

      if (formData.password && formData.password.length < 8) {
        setError(t("passwordTooShort"))
        return false
      }

      if (formData.password !== confirmPassword) {
        setError(t("passwordsDoNotMatch"))
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = user?.id ? `/api/users/${user.id}` : "/api/users"
      const method = user?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSubmit(formData)
      } else {
        const data = await response.json()
        setError(data.message || t("failedToSaveUser"))
      }
    } catch (error) {
      console.error("Error saving user:", error)
      setError(t("errorSavingUser"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? t("editUser") : t("addUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{user ? t("newPassword") : t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                minLength={8}
                placeholder={user ? t("leaveBlankToKeep") : ""}
                autoComplete={user ? "new-password" : "current-password"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!user || !!formData.password}
                minLength={8}
                autoComplete={user ? "new-password" : "current-password"}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="isAdmin" checked={formData.isAdmin} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="isAdmin">{t("isAdmin")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : user ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

