// powminer.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"

#include "arith_uint256.h"
#include <string>
#include <sstream>
#include <Windows.h>
#include "sha256.h"
using namespace std;


bool CheckProofOfWork(uint256 hash, unsigned int nBits, void* params /*const Consensus::Params& params*/)
{
	bool fNegative;
	bool fOverflow;
	arith_uint256 bnTarget;

	bnTarget.SetCompact(nBits, &fNegative, &fOverflow);
	uint256 powLimit = uint256S("0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

	// Check range
	/*arith_uint256 pow = UintToArith256(powLimit);
	if (fNegative || bnTarget == 0 || fOverflow || bnTarget > pow) {
		printf((bnTarget.ToString() + " NOPE\n").c_str());
		Sleep(100);
		return false;
	}*/
		
	printf((bnTarget.ToString() + " NOPE\n").c_str());
	// Check proof of work matches claimed amount
	arith_uint256 hash2 = UintToArith256(hash);
	//printf((hash.ToString() + "\n").c_str());
	if (hash2 > bnTarget) {
		
		//Sleep(100);
		//printf("no");
		return false;
	}

	return true;
}
int main()
{
	unsigned int bits = 0x19015f53;

	unsigned int F = 0xA;
	unsigned int R = 0x015f53;

	unsigned int difficulty_one_target = 0x00ffff * 2 ^ (8 * (0x1d - 3));
	std::string test = "hailhitler";

	uint256 test2;//SerializeHash(test.c_str());
	
	//printf("%s\n", uint256S(test).ToString().c_str());
	printf("DIFICULTY? %u\n", difficulty_one_target);
	bool foundhash = false;
	unsigned int nonce = 0;
	while (!foundhash)
	{
		stringstream n;
		n << nonce;
		foundhash = CheckProofOfWork(uint256S(sha256(test + n.str())), difficulty_one_target, NULL);
		nonce++;
		break;
	}
	
	system("pause");
    return 0;
}

