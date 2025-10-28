#ifndef NOT_IMPLEMENTED_EXCEPTION_H
#define NOT_IMPLEMENTED_EXCEPTION_H

#include <stdexcept>
#include <string>

class NotImplementedException : public std::logic_error {
public:
    explicit NotImplementedException(const std::string& message = "Not Implemented")
        : std::logic_error(message) {}

    // Use noexcept-qualified what() override for compatibility and clarity
    const char* what() const noexcept override {
        return std::logic_error::what();
    }
};

#endif // NOT_IMPLEMENTED_EXCEPTION_H
