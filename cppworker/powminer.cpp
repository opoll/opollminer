// powminer.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"

#include "arith_uint256.h"
#include <string>
#include <sstream>
#include <Windows.h>
#include "sha256.h"
using namespace std;


uint256 maxtarget;
uint256 curtarget;

uint256 powLimit;

arith_uint256 totalhashes = 0;
bool CheckProofOfWork(uint256 hash, unsigned int nBits, void* params /*const Consensus::Params& params*/)
{
	bool fNegative;
	bool fOverflow;
	arith_uint256 bnTarget;

	//bnTarget.SetCompact(nBits, &fNegative, &fOverflow);


	// Check range
	//arith_uint256 pow = UintToArith256(powLimit);

	arith_uint256 hash2 = UintToArith256(hash);

	arith_uint256 cur = UintToArith256(curtarget);

	
	//printf((bnTarget.ToString() + " NOPE\n").c_str());
	// Check proof of work matches claimed amount
	
	//printf((hash.ToString() + "\n").c_str());
	if (cur < hash2) {
		
		//Sleep(100);
		//printf("no");
		//printf((bnTarget.ToString() + " GRTEATER THEN CURTARGET\n").c_str());
		return false;
	}

	/*if  (hash2 > UintToArith256(maxtarget)) {
		printf((bnTarget.ToString() + " HIGHER THEN MAX\n").c_str());
		//Sleep(100);
		return false;
	}*/


	return true;
}
#include <iostream>
void  test() {
	for (;;) {
		Sleep(10000);
		printf("HASHRATE: %uh/s", totalhashes / 10);
		cout.flush();
		totalhashes = 0;
	}
}


string cstr_to_str(const char * str)
{
	string tmp_str(str);
	return tmp_str;
}


#include <random>

int main()
{
	//freopen("CONOUT$", "w", stdout);
	CreateThread(NULL, NULL, (LPTHREAD_START_ROUTINE)test, NULL, NULL, NULL);

	std::random_device rd;

	

	/* Random number generator */
	std::default_random_engine gen(rd());

	std::uint64_t nonce = gen();

	unsigned int bits = 0x000000ffff;

	maxtarget = uint256S("0x00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

	arith_uint256 dif = 1/UintToArith256(maxtarget);
	curtarget = uint256S("0x000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

	arith_uint256 count = UintToArith256(maxtarget);
	unsigned int F = 0xA;
	unsigned int R = 0x015f53;

	unsigned int difficulty_one_target = 0x19015f53;
	std::string test;
	cin >> test;
	uint64_t test2;//SerializeHash(test.c_str());
	

	unsigned char digest[SHA256::DIGEST_SIZE];
	memset(digest, 0, SHA256::DIGEST_SIZE);

	
	//ctx.update((unsigned char *)nonse.c_str(), nonse.size());
	//string final = ctx.finalstring();



	//printf("%s  DIGEST: %s\n", count.ToString().c_str(), final.c_str());
	//unsigned int nonce = rand();

	printf("MINING HASH FOR DATA: \"%s\" STARTING NONCE: %u", test.c_str(),  nonce);
	cout.flush();
	bool foundhash = false;
	
	uint256 hash;
	while (!foundhash)
	{
		string nonces = to_string(nonce);

		SHA256 ctx = SHA256();
		ctx.init();
		ctx.update((unsigned char*)test.c_str(), test.size());
		ctx.update((unsigned char*)nonces.c_str(), nonces.size());

		hash = uint256S(ctx.finalstring());
		foundhash = CheckProofOfWork(hash, bits, NULL);
		nonce++;
		totalhashes++;
		//break;
	}
	printf("HASH MINED: %s NONCE: %u", hash.ToString().c_str(), nonce - 1);
	

    return 111;
}

