import { SignIn } from '@clerk/nextjs'

export default function Home() {

  return (
    <div className="w-full flex justify-end p-4">
      <div className="lg:w-[400px]">
        <SignIn />
      </div>
    </div>
  )
}