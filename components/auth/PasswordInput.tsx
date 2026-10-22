"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

// A password field with show/hide, for typing on a phone without guessing.
export default function PasswordInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${className} pr-12`} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"} className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-full text-zinc-400 hover:text-zinc-50">
        {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
      </button>
    </div>
  );
}
