import { useContract, useSigner } from 'wagmi';
import erc20Interface from '../../contracts/abi/ERC20.json';

export default function useERC20Contract(address?: string) {
  const [signerStates] = useSigner();
  const contract = useContract({
    addressOrName: address ?? '0x0000000000000000000000000000000000000000',
    contractInterface: erc20Interface,
    signerOrProvider: signerStates.data,
  });

  return contract;
}