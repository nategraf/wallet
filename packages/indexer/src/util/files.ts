import * as admin from 'firebase-admin'
import stream from 'stream'

export async function uploadFile(bucketName: string, destination: string, content: string) {
  const file = admin.storage().bucket(bucketName).file(destination)
  const dataStream = new stream.PassThrough()
  dataStream.push(content)
  dataStream.push(null)

  await new Promise((resolve, reject) => {
    dataStream
      .pipe(
        file.createWriteStream({
          resumable: false,
          validation: false,
          metadata: { 'Cache-Control': 'public, max-age=31536000' },
        })
      )
      .on('error', (error: Error) => {
        reject(error)
      })
      .on('finish', () => {
        resolve(true)
      })
  })
}

export async function readFile(bucketName: string, path: string) {
  const file = admin.storage().bucket(bucketName).file(path)
  const content = await file.download()
  return JSON.parse(content.toString())
}
