import sys
import struct

def parse_bank(file_path):
    print(f"Parsing: {file_path}")
    with open(file_path, 'rb') as f:
        data = f.read()
    
    print(f"File size: {len(data)} bytes")
    
    # Try FMOD bank headers (RIFF/FMOD)
    if data[:4] == b'RIFF':
        print("Found RIFF Header")
    elif data[:4] == b'FMOD':
        print("Found FMOD Header")
        
    fsb_matches = []
    idx = 0
    while True:
        idx = data.find(b'FSB5', idx)
        if idx == -1:
            break
        fsb_matches.append(idx)
        idx += 4
        
    if fsb_matches:
        print(f"Found {len(fsb_matches)} FSB5 banks embedded.")
        for i, match_idx in enumerate(fsb_matches):
            print(f"FSB5 Bank {i} at offset: {match_idx}")
            # Write to extracted file
            output_name = f'F:\\StronyInternetowe\\AlfaRomeo\\alfa-romeo-experience\\src\\assets\\sfx\\extracted_{i}.fsb'
            # Estimate size: the size is often stored at offset + 4
            # Usually the FSB bank lasts until the next FSB bank or end of file
            end_idx = fsb_matches[i+1] if i + 1 < len(fsb_matches) else len(data)
            with open(output_name, 'wb') as out_f:
                out_f.write(data[match_idx:end_idx])
            print(f"-> Saved to {output_name}")
    else:
        print("No FSB5 headers found.")
        
parse_bank('F:\\StronyInternetowe\\AlfaRomeo\\alfa-romeo-experience\\src\\assets\\sfx\\giulia_quadrifoglio_zf8.bank')
