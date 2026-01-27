import subprocess
import os
import sys

def run_command(command):
    try:
        subprocess.run(command, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"Erro no comando: {e}")
        sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print("Uso: python script.py <PASTA_VIDEO> <CAMINHO_MUSICA>")
        sys.exit(1)

    work_dir = sys.argv[1]
    music_input = sys.argv[2]

    # Converte o caminho da música para absoluto ANTES de mudar de diretório
    music_abs_path = os.path.abspath(music_input)

    if not os.path.isdir(work_dir):
        print(f"Erro: Diretório {work_dir} não existe.")
        sys.exit(1)

    if not os.path.exists(music_abs_path):
        print(f"Erro: Música {music_abs_path} não encontrada.")
        sys.exit(1)

    # Entra na pasta do vídeo
    os.chdir(work_dir)

    # 1. Concatena
    run_command("ffmpeg -f concat -safe 0 -i inputs.txt -c:v libx264 -preset veryfast -crf 18 -c:a aac -b:a 192k output.mp4")

    # 2. Isola voz (Demucs)
    run_command("demucs -n htdemucs output.mp4")

    vocals_path = os.path.join("separated", "htdemucs", "output", "vocals.wav")
    
    if not os.path.exists(vocals_path):
        print("Erro: Demucs falhou.")
        sys.exit(1)

    # 3. Reconstroi vídeo mudo + voz limpa
    run_command(f'ffmpeg -y -i output.mp4 -i "{vocals_path}" -c:v copy -map 0:v -map 1:a -c:a aac -b:a 192k output_apenas_voz.mp4')

    # 4. Mixagem final (usa o caminho absoluto da música)
    run_command(
        f'ffmpeg -y -i output_apenas_voz.mp4 -i "{music_abs_path}" '
        '-filter_complex "[1:a]volume=0.2[bg];[0:a][bg]amix=inputs=2:duration=first[a]" '
        '-map 0:v -map "[a]" -c:v copy -c:a aac output_final_com_musica.mp4'
    )

    print("SUCESSO")

if __name__ == "__main__":
    main()