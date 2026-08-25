import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export function FileUpload({ onFileSelect }) {
  const [fileName, setFileName] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5242880, // 5 MB expresados en bytes
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-estado-exito bg-superficie-media' : 'border-acento-secundario bg-fondo-secundario'}
        ${isDragReject ? 'border-estado-error' : ''}
      `}
      role="button"
      tabIndex={0}
      aria-label="Subir certificado de discapacidad en formato PDF"
    >
      <input {...getInputProps()} />
      {fileName ? (
        <p className="text-estado-exito font-medium">Archivo seleccionado: {fileName}</p>
      ) : (
        <>
          <p className="text-texto-principal font-medium">
            Tocá para adjuntar tu certificado
          </p>
          <p className="text-acento-secundario text-sm mt-1">
            Solo archivos PDF - Máx. 5 MB
          </p>
        </>
      )}
    </div>
  );
}