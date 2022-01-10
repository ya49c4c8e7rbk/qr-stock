import React, { FC, useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser"
import { Result } from "@zxing/library"
import {
  Box,
  ChakraProvider,
  Container,
  Fade,
  Flex,
  Heading,
  Table,
  Tbody,
  Td,
  Tr
} from "@chakra-ui/react"
import { db } from "./firebase";
import { ref, set, push } from "firebase/database";

interface IQRRow {
  qrcode: string;
  datetime: string;
  memo?: string; 
}

const QrCodeReader: FC<{ onReadQRCode: (text: Result) => void }> = ({
  onReadQRCode
}) => {
  const controlsRef = useRef<IScannerControls | null>()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoRef.current) {
      return
    }
    const codeReader = new BrowserQRCodeReader()
    codeReader.decodeFromVideoDevice(
      undefined,
      videoRef.current,
      (result, error, controls) => {
        if (error) {
          return
        }
        if (result) {
          onReadQRCode(result)
        }
        controlsRef.current = controls
      }
    )
    return () => {
      if (!controlsRef.current) {
        return
      }

      controlsRef.current.stop()
      controlsRef.current = null
    }
  }, [onReadQRCode])

  return (
    <video
      style={{ maxWidth: "100%", maxHeight: "100%", height: "100%" }}
      ref={videoRef}
    />
  )
}

const QrCodeResult: FC<{ qrCodes: IQRRow[], setQrCodes: React.Dispatch<React.SetStateAction<IQRRow[]>> }> = ({ qrCodes, setQrCodes }) => {
  const regist = () => {
    qrCodes.forEach((row, i) => {
      push(ref(db, 'qrcodes'), row);
    });
    setQrCodes([]);
  };
  
  const remove = (index: number) => {
    delete qrCodes[index];
    setQrCodes(qrCodes.filter(v => v));
  };

  return (
    <div>
      <Table>
        <Tbody>
          {qrCodes.map((row, i) => (
            <Tr key={i}>
              <Td>
                <Fade in={true}>{row.qrcode}</Fade>
              </Td>
              <Td>
                <button type="button" onClick={() => { remove(i); } }>削除</button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <button type="button" onClick={() => { regist(); } }>登録</button>
    </div>
  )
}

const QrApp = () => {
  const [qrCodes, setQrCodes] = useState<IQRRow[]>([]);

  const now = (): string => {
    const dt = new Date();
    return `${dt.getFullYear()}-${('00' + (dt.getMonth() + 1)).slice(-2)}-${('00' + dt.getDate()).slice(-2)} ${('00' + dt.getHours()).slice(-2)}:${('00' + dt.getMinutes()).slice(-2)}:${('00' + dt.getSeconds()).slice(-2)}`;
  }

  return (
    <ChakraProvider>
      <Container>
        <Flex flexDirection="column">
          <Box flex={1} height={"60vh"}>
            <QrCodeReader
              onReadQRCode={(result) => {
                setQrCodes((codes) => {
                  return [{
                    qrcode: result.getText(),
                    datetime: now(),
                  }, ...codes]
                })
              }}
            />
          </Box>
          <Box flex={1} height={"40vh"}>
            <Heading>Result</Heading>
            <QrCodeResult qrCodes={qrCodes} setQrCodes={setQrCodes} />
          </Box>
        </Flex>
      </Container>
    </ChakraProvider>
  )
}

export default function Home() {
  return (
    <ChakraProvider>
      <QrApp />
    </ChakraProvider>
  )
}