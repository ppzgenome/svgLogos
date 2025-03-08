import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { BuyMeCoffeeButton } from './BuyMeCoffeeButton'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="card w-full max-w-md">
                <Dialog.Title as="h3" className="text-xl font-bold logo-gradient mb-4">
                  About svgLogos
                </Dialog.Title>
                
                <div className="space-y-4 text-gray-700">
                  <p>
                    We've all been there—you need a bunch of logos for a presentation, marketing project, or website. You need them fast. And they all need to be consistent. But hunting for logos on Google Images is a hassle. Finding the right format? Even worse. Do you need a JPEG with a white background? A transparent PNG? Or a crisp, scalable SVG? And then there's resizing, styling, adding borders—it all adds up to wasted time.
                  </p>
                  
                  <p>
                    Not anymore! svgLogos makes it effortless.
                  </p>
                  
                  <p>
                    Now you can bulk search for company and brand logos in seconds. Get multiple versions at once, then batch-edit formats, styles, borders, and sizes—all in one go. The best part? Download them all with a single click. And it's completely free!
                  </p>
                  
                  <p>
                    Stop wasting time. Start curating with svgLogos!
                  </p>
                </div>

                {/* Buy Me a Coffee button and QR code */}
                <div className="mt-6 flex flex-col items-center gap-4">
                  <BuyMeCoffeeButton />
                  
                  {/* QR Code */}
                  <div className="mt-2 flex flex-col items-center">
                    <img 
                      src="https://bxegwxrggebnjnowjvol.supabase.co/storage/v1/object/public/internal-logo-repo//bmc_qr.png" 
                      alt="Buy Me a Coffee QR Code" 
                      className="w-32 h-32 mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">Scan to support</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
