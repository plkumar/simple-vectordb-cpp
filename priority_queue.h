#ifndef PRIORITY_QUEUE_H
#define PRIORITY_QUEUE_H

#include <vector>
#include <queue>
#include <cmath>
#include <set>
#include <algorithm>
#include <iostream>
#include<functional>

template<typename T>
class PriorityQueue {
private:
    std::vector<T> elements;
    std::function<bool(T, T)> compareFn;

public:
    PriorityQueue(std::vector<T> elements, std::function<bool(T, T)> compareFn)
        : elements(elements), compareFn(compareFn) {
        std::sort(this->elements.begin(), this->elements.end(), this->compareFn);
    }

    void push(T element) {
        elements.push_back(element);
        std::sort(elements.begin(), elements.end(), compareFn);
    }

    T pop() {
        T element = elements.front();
        elements.erase(elements.begin());
        return element;
    }

    bool isEmpty() const {
        return elements.empty();
    }
};

#endif //PRIORITY_QUEUE_H