import { useEffect, useState } from 'react'
import { getUrl } from 'aws-amplify/storage'

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  path: string | null | undefined
}

export default function StorageImage({ path, alt, ...props }: StorageImageProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!path) return
    if (path.startsWith('http')) {
      setSrc(path)
      return
    }
    getUrl({ path }).then(({ url }) => setSrc(url.toString())).catch(() => setSrc(null))
  }, [path])

  if (!src) return null
  return <img src={src} alt={alt} {...props} />
}
