package br.edu.fatecpg.api.auth;

import java.util.Objects;
import java.util.stream.Collectors;

import br.edu.fatecpg.api.auth.AuthDtos.ErrorResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(AuthException.class)
    ResponseEntity<ErrorResponse> tratarAuth(AuthException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(new ErrorResponse(exception.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> tratarValidacao(MethodArgumentNotValidException exception) {
        String detalhe = exception.getBindingResult().getAllErrors().stream()
                .map(error -> Objects.requireNonNullElse(error.getDefaultMessage(), "valor inválido"))
                .distinct()
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(new ErrorResponse("Dados inválidos.", detalhe));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorResponse> tratarConflito(DataIntegrityViolationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("Já existe um registro com os dados informados ou há uma dependência que impede esta operação.", null));
    }
}
