#ifndef NOT_IMPLEMENTED_EXCEPTION_H
#define NOT_IMPLEMENTED_EXCEPTION_H

#include <string>

class NotImplementedException : public std::logic_error
{
private:

    std::string _text;

    NotImplementedException(const char* message, const char* function)
        :
        std::logic_error("Not Implemented")
    {
        _text = message;
        _text += " : ";
        _text += function;
    };

public:

    NotImplementedException()
        :
        NotImplementedException("Not Implememented", __FUNCTION__)
    {
    }

    NotImplementedException(const char* message)
        :
        NotImplementedException(message, __FUNCTION__)
    {
    }

    virtual const char *what() const throw()
    {
        return _text.c_str();
    }
};

#endif //NOT_IMPLEMENTED_EXCEPTION_H