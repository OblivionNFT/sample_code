# %% Libraries
import requests
import time
import json

# %% Data
with open('./1/parameters_creeper_bot_bid.json', 'r') as f:
    obj_js = json.load(f)

with open('./collections.json', 'r') as f:
    collections = json.load(f)

with open('./1/wallets.json', 'r') as f:
    wallets_info = json.load(f)

# %%
accountAddress = wallets_info['accountAddress']
all_accountAddress = [x.lower() for x in accountAddress]
token_bid = obj_js['tokenAddresses_bid']
token_check = collections.keys()

tokenAddresses_Bid = [x.lower() for x in token_bid]
tokenAddresses_Check = [x.lower() for x in token_check]

addr_check = []
for nft in tokenAddresses_Check:
    addr_check.append(nft.lower()[2:])

#%% Proxies
all_proxies = requests.get('https://proxy.webshare.io/proxy/list/download/nquitkmkzvfygxiigjkwalxgeutbbvlbyerfmtvb/-/http/username/domain/')

all_proxies = all_proxies.text.split('\r\n')
proxies_list = []

for i in all_proxies:
    if i != '':
        vals = i.split(':')
        proxy_api = 'http://'+ vals[2]+ ":" + vals[3] + "@" + vals[0] + ":" + vals[1]
        proxies_list.append(proxy_api)

proxies_save = {}
proxies_save['proxy_list'] = proxies_list

for i in range(1,obj_js['num_folders']+1):
    with open("./{}/proxies_list.json".format(i), "w") as outfile:
        json.dump(proxies_save, outfile)
print('Proxies Saved.')

# %%
date_prev = time.time() / (60*60)
just_start = 1
flag_start = -1
flag_timer_prev = time.time()

blocks = {}

bad_wallets = []
wallets_to_check = []

while True:
    if (time.time() / (60*60) - date_prev >= 1):
        print('One hour has passed. Dumping old wallets.')
        date_prev = time.time() / (60*60)

        drop_block_Param = {
            'module': 'block',
            'action': 'getblocknobytime',
            'timestamp': int(int(time.time()) - obj_js['t2']*60*60),
            'closest': 'before',
            'apikey': obj_js['events_apiKey'][0]
        }

        drop_body_resp = False

        while drop_body_resp == False:
            try:
                drop_body = requests.get(
                    url='https://api.etherscan.io/api', params=drop_block_Param, timeout=5)
                drop_body_resp = True
            except:
                print('Block response failed, retrying.')
                drop_body_resp = False

        drop_response = drop_body.json()
        dropblock = int(drop_response['result'], 16)
        dropblock_list = [x for x in list(blocks.keys()) if x < dropblock]
        [blocks.pop(key) for key in dropblock_list]

    if obj_js['t1'] == 0:
        time_multiplier = 12
    else:
        time_multiplier = obj_js['t1']*60

    if ((just_start == 1) | (time.time() - flag_timer_prev > time_multiplier)):
        print('----------------------------------------------------Checking new blocks for transactions.----------------------------------------------------')
        flag_timer_prev = time.time()
        got_blocks = False
        while got_blocks == False:
            try:
                if obj_js['t1'] == 0:
                    latest_block_Param = {
                        'module': 'proxy',
                        'action': 'eth_blockNumber',
                        'apikey': obj_js['events_apiKey'][0]
                    }
                    block_body = requests.get(
                        url='https://api.etherscan.io/api', params=latest_block_Param, timeout=5)
                    block_response = block_body.json()
                    endblock = int(block_response['result'],16)
                else:
                    latest_block_Param = {
                        'module': 'block',
                        'action': 'getblocknobytime',
                        'timestamp': int(int(time.time()) - obj_js['t1']*60*60),
                        'closest': 'before',
                        'apikey': obj_js['events_apiKey'][0]
                    }
                    block_body = requests.get(
                        url='https://api.etherscan.io/api', params=latest_block_Param, timeout=5)
                    block_response = block_body.json()
                    endblock = int(block_response['result'])

                if just_start == 1:
                    prev_block_Param = {
                        'module': 'block',
                        'action': 'getblocknobytime',
                        'timestamp': int(int(time.time()) - obj_js['t2']*60*60),
                        'closest': 'before',
                        'apikey': obj_js['events_apiKey'][0]
                    }
                    prev_block_body = requests.get(
                        url='https://api.etherscan.io/api',
                        params=prev_block_Param,
                        timeout=50000)
                    prev_block_response = prev_block_body.json()
                    startblock = int(prev_block_response['result'])
                    check_events = True
                    endblock_iter = startblock + 100
                    if (endblock_iter > endblock):
                        endblock_iter = endblock
                    if (endblock > startblock):
                        check_events = True
                    else:
                        check_events = False
                else:
                    startblock = endblock - 10
                    endblock_iter = startblock + 100

                    if (endblock_iter > endblock):
                        endblock_iter = endblock
                    if (endblock > startblock):
                        check_events = True
                    else:
                        check_events = False
                got_blocks = True
            except:
                print('Block API error (DC most likely). Retrying')

        if check_events:
            while (endblock_iter <= endblock):
                got_events = False
                while got_events == False:
                    print('Checking blocks {} to {} of {}.'.format(
                        str(startblock), str(endblock_iter), str(endblock)))
                    try:
                        tx_transfer_params = {
                            'module': 'account',
                            'action': 'txlist',
                            'address': '0x7f268357A8c2552623316e2562D90e642bB538E5',
                            'startblock': startblock,
                            'endblock': endblock_iter,
                            'page': 1,
                            'offset': 10000,
                            'sort': 'asc',
                            'apikey': obj_js['events_apiKey'][0]
                        }
                        get_tx_transfer_request = requests.get(
                            url='https://api.etherscan.io/api',
                            params=tx_transfer_params,
                            timeout=5)
                        tx_response = get_tx_transfer_request.json()['result']
                        if len(tx_response) >= 10000:
                            tx_transfer_params = {
                                'module': 'account',
                                'action': 'txlist',
                                'address': '0x7f268357A8c2552623316e2562D90e642bB538E5',
                                'startblock': startblock,
                                'endblock': endblock_iter,
                                'page': 1,
                                'offset': 9000,
                                'sort': 'asc',
                                'apikey': obj_js['events_apiKey'][0]
                            }
                            get_tx_transfer_request = requests.get(
                                url='https://api.etherscan.io/api',
                                params=tx_transfer_params,
                                timeout=5)
                        tx_response = get_tx_transfer_request.json()['result']

                        if len(tx_response) > 0:
                            print(len(tx_response))
                            startblock = int(tx_response[-1]['blockNumber']) + 1
                            endblock_iter = startblock + 100
                            for key in tx_response:
                                if ((key['input'].startswith('0xab834bab')) & (key['input'][3626:3666] in addr_check) and (key['input'][418:458] == 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') and (key['from'] not in all_accountAddress)):
                                    if int(key['blockNumber'], 16) not in blocks.keys():
                                        blocks[int(key['blockNumber'], 16)] = []
                                        blocks[int(key['blockNumber'], 16)].append(
                                            key['from'])
                                    else:
                                        if key['from'] not in blocks[int(key['blockNumber'], 16)]:
                                            blocks[int(key['blockNumber'], 16)].append(
                                                key['from'])
                            got_events = True
                        else:
                            print(
                                'Blocks were empty in this API call. Increasing endpoint by 1.')
                            print(startblock, endblock_iter, endblock)
                            endblock_iter = endblock_iter + 1
                            flag_events = 1
                    except:
                        print('Events endpoint throttled, retrying.');
                        print(startblock, endblock_iter, endblock)
                        time.sleep(1.5)
        just_start = -1
        wallets_save = {}
        wallets_save['address'] = []
        for key, value in blocks.items():
            wallets_save['address'].append(value)
        wallets_save['address'] = list(
            set([item for sublist in wallets_save['address'] for item in sublist]))
        with open("wallets_to_check.json", "w") as outfile:
            json.dump(wallets_save, outfile)
        print('{} wallets to check. Wallets file saved.'.format(
            len(wallets_save['address'])))

# %%

# %%
