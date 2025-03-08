import { FiCoffee } from 'react-icons/fi'

export const BuyMeCoffeeButton = () => {
  return (
    <a
      href="https://buymeacoffee.com/ppzgenome"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFDD00] hover:bg-[#E5C700] text-black font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow"
    >
      <FiCoffee className="w-5 h-5" />
      <span>Buy me a coffee</span>
    </a>
  );
};
