import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import spectrogram
import warnings
import json
import os

# Suppress warnings
warnings.filterwarnings("ignore")

def load_and_process_audio(file_path):
    """
    Load a WAV file and convert to a normalized spectrogram.
    Returns: (frequencies, times, spectrogram_magnitude)
    """
    try:
        # Read WAV file
        sample_rate, data = wavfile.read(file_path)

        # Convert to mono if stereo
        if len(data.shape) > 1:
            data = data.mean(axis=1)

        # Check duration (min 0.5s)
        duration = len(data) / sample_rate
        if duration < 0.5:
            return None, None, None

        # Check Audio Amplitude (Silence Detection)
        # wavfile.read typically returns int16. Threshold of 500 (~1.5% of max volume) protects against silence.
        # If float, we check 0.015.
        max_val = np.max(np.abs(data))
        if data.dtype == np.int16:
            if max_val < 800: # Increased threshold for silence
                return None, None, None
        else:
            # Assuming float -1.0 to 1.0
            if max_val < 0.03:
                return None, None, None

        # Normalize audio data
        data = data.astype(np.float32)
        if np.max(np.abs(data)) > 0:
            data = data / np.max(np.abs(data))
        else:
            return None, None, None

        # Generate Spectrogram
        # nperseg=256 gives a good balance for speech features
        f, t, Sxx = spectrogram(data, sample_rate, nperseg=256)
        
        # Log scaling for better feature representation
        Sxx = np.log1p(Sxx)
        
        return f, t, Sxx
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None, None, None

def compare_spectrograms(Sxx1, Sxx2):
    """
    Compare two spectrograms using cross-correlation.
    Since audio length varies, we truncate to the shorter length or slide.
    For simplicity in this localized environment, we truncate/resize to match.
    """
    # Align shapes (Truncate to shorter time duration)
    min_time = min(Sxx1.shape[1], Sxx2.shape[1])
    
    s1 = Sxx1[:, :min_time]
    s2 = Sxx2[:, :min_time]

    # Flatten arrays
    flat1 = s1.flatten()
    flat2 = s2.flatten()

    # Calculate Pearson Codefficient (Correlation)
    correlation = np.corrcoef(flat1, flat2)[0, 1]
    
    return correlation

def verify_audio(path1, path2):
    """
    Loads two audio files, processes them into spectrograms,
    and calculates the Euclidean distance between their flattened spectrograms.
    Returns a distance score (lower is better).
    """
    _, _, spec1 = load_and_process_audio(path1)
    _, _, spec2 = load_and_process_audio(path2)

    if spec1 is None or spec2 is None:
        # Return a very high distance if processing fails
        return float('inf')

    # Align shapes (Truncate to shorter time duration)
    len1 = spec1.shape[1]
    len2 = spec2.shape[1]

    # STRICT LENGTH CHECK:
    # Captures must be similar in duration (±20%) to the reference.
    # This prevents short words ("Hi") from matching long phrases ("Login to my desk").
    if len2 > 0:
        ratio = len1 / len2
        if ratio < 0.8 or ratio > 1.2:
            # sys.stderr.write(f"Length Mismatch: Candidate={len1}, Ref={len2}, Ratio={ratio:.2f}\n")
            return float('inf')

    min_time = min(len1, len2)
    
    s1 = spec1[:, :min_time]
    s2 = spec2[:, :min_time]

    # Flatten arrays
    flat1 = s1.flatten()
    flat2 = s2.flatten()

    # Calculate Euclidean distance
    distance = np.linalg.norm(flat1 - flat2)
    return distance

def main():
    if len(sys.argv) < 3:
        print("Usage for verify: python3 voice_auth.py verify <candidate_wav_path> <reference_wav_path> [passphrase]")
        print("Usage for identify: python3 voice_auth.py identify <candidate_wav_path> <json_list_of_refs>")
        sys.exit(1)

    # Mode: "verify" (1:1) or "identify" (1:N)
    mode = sys.argv[1]
    candidate_path = sys.argv[2]

    if mode == "verify":
        if len(sys.argv) < 4:
            print("Usage for verify: python3 voice_auth.py verify <candidate_wav_path> <reference_wav_path> [passphrase]")
            sys.exit(1)
        reference_path = sys.argv[3]
        passphrase = sys.argv[4] if len(sys.argv) > 4 else ""

        # 1. Compare Spectrograms (Biometrics)
        score = verify_audio(candidate_path, reference_path)

        # 2. Match Passphrase (Optional - simple length/energy check or advanced STT)
        # For this MVP, we rely on the spectral match which implicitly captures the phrase content.
        # Ideally, use distinct logic to transcribe and check text.
        
        # Threshold: Lower is better (euclidean distance)
        # Empirical threshold - need to tune based on real mic data
        THRESHOLD = 4000.0 

        is_match = score < THRESHOLD

        print(json.dumps({
            "match": bool(is_match),
            "score": float(score),
            "threshold": float(THRESHOLD)
        }))
    
    elif mode == "identify":
        if len(sys.argv) < 4:
            print("Usage for identify: python3 voice_auth.py identify <candidate_wav_path> <json_list_of_refs>")
            sys.exit(1)
        # Identify best match from a list of references
        # Usage: python voice_auth.py identify <candidate> <json_list_of_refs>
        # json_list_of_refs = [{"userId": "123", "path": "..."}]
        
        references_json = sys.argv[3]
        references = json.loads(references_json)
        
        best_score = float('inf')
        best_user = None
        THRESHOLD = 4000.0
        
        for ref in references:
            try:
                ref_path = ref['path']
                # Resolve relative paths
                if not os.path.isabs(ref_path):
                     # assuming path is relative to project root / public
                     # But simple logic: caller sends full path
                     pass
                
                score = verify_audio(candidate_path, ref_path)
                
                if score < best_score:
                    best_score = score
                    best_user = ref['userId']
            except Exception as e:
                # print(f"Error processing reference {ref.get('userId', 'unknown')}: {e}", file=sys.stderr)
                continue # Skip bad files
        
        final_score = best_score if best_score != float('inf') else 999999.0
        
        # Debug info to stderr
        sys.stderr.write(f"Processed {len(references)} references. Best Score: {final_score}, Best User: {best_user}\n")

        print(json.dumps({
            "match": bool(best_score < THRESHOLD),
            "userId": best_user if best_score < THRESHOLD else None,
            "score": float(final_score),
            "threshold": float(THRESHOLD)
        }))
    else:
        print(f"Unknown mode: {mode}. Use 'verify' or 'identify'.")
        sys.exit(1)

if __name__ == "__main__":
    main()
