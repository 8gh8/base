// Import necessary types and functions
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { create_signature } from './signature';
import { Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Constants for NFT contract address and token ID
const NFT_CONTRACT_ADDRESS = '0x204B70042E2FD080ab88bdCAcB9a557EE3da4bBc';
const TOKEN_ID = '0';

// Create a public client for interacting with the Base network
const client = createPublicClient({
  chain: base,
  transport: http(),
});

// Main handler function for the API endpoint
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract the address from the query parameters
    const { address } = req.query;

    // Validate the address
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Invalid address provided' });
    }

    // Verify if the address is the owner of the NFT
    const isOwner = await checkNFTOwnership(address as Address);
    console.log(`Ownership check result: ${isOwner}`);

    // Create a signature for the verification result
    const signature = await create_signature(address as Address, isOwner);

    // Return the verification result and signature
    return res.status(200).json({ isOwner, signature });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error in handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Function to check if an address is the owner of the NFT
async function checkNFTOwnership(address: Address): Promise<boolean> {
  try {
    // Get the owner of the specified token ID from the NFT contract
    const owner = await client.readContract({
      address: NFT_CONTRACT_ADDRESS as Address,
      abi: [
        {
          constant: true,
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          name: 'ownerOf',
          outputs: [{ name: '', type: 'address' }],
          type: 'function',
        },
      ],
      functionName: 'ownerOf',
      args: [TOKEN_ID],
    });

    // Check if the provided address matches the owner of the token
    const isOwner = owner === address;

    console.log(`Address: ${address}, NFT Owner: ${owner}, Is Owner: ${isOwner}`);

    // Return the ownership status
    return isOwner;
  } catch (error) {
    // Handle any errors that occur during ownership verification
    console.error('Error fetching NFT owner:', error);
    throw new Error('Failed to verify NFT ownership');
  }
}
